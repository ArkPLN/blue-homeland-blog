import type { IAudioMetadata, ILyricsTag } from 'music-metadata'
import { compileProgram } from '../sonnet/program-compiler'
import { hashString } from '../random'
import type { GraphemeTiming, LyricLine, Program, WordTiming } from '../sonnet/types'
import { parseLrc } from './lrc'
import type { ParsedLrcWord } from './lrc'

export interface ImportedLyrics {
  title: string
  artist: string
  album: string
  duration: number
  lines: LyricLine[]
  program: Program
  seed: string
  source: string
  timed: boolean
  /** Number of lines whose characters were snapped to real audio onsets. */
  aligned: number
  previewTime: number
  cover?: { data: Uint8Array; format: string }
}

const creditPattern = /^(作词|作曲|编曲|制作人?|演唱|出品|发行|监制|混音|母带|吉他|贝斯|鼓|键盘|和声|lyrics?|composed?|arranged?|produced?|written?|music|producer|mixed|mastered)\s*[:：]/i
const wordSegmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
  : null

function graphemes(text: string): string[] {
  return Array.from(text)
}

function splitWords(text: string): string[] {
  const words: string[] = []
  if (wordSegmenter) {
    for (const part of wordSegmenter.segment(text)) {
      const value = part.segment.trim()
      if (value) words.push(value)
    }
  } else {
    words.push(...text.split(/\s+/).filter(Boolean))
  }
  return words.length > 0 ? words : [text]
}

/** Strip whitespace and full/half-width punctuation so title variants still match. */
function normalizeForCompare(text: string): string {
  return text
    .replace(/[\s\u3000]/gu, '')
    .replace(/[()（）\[\]【】《》<>「」·、,，.。!！?？:：;；'"'"—–\-]/gu, '')
    .toLowerCase()
}

function isCredit(text: string, title: string, artist: string): boolean {
  if (creditPattern.test(text)) return true
  // Many tags repeat the song title as the first lyric line. Treat an exact
  // title/artist echo as a credit so it never becomes a caption.
  const bare = normalizeForCompare(text)
  if (bare && (bare === normalizeForCompare(title) || bare === normalizeForCompare(artist))) return true
  if (!title || !artist) return false
  return text.includes(' - ') && text.includes(title) && text.includes(artist)
}

function makeWords(text: string, start: number, end: number): WordTiming[] {
  const words = splitWords(text)
  const weights = words.map((word) => Math.max(1, graphemes(word).length))
  const total = weights.reduce((sum, value) => sum + value, 0)
  const span = Math.max(0.2, end - start - 0.08)
  let cursor = start + 0.04
  return words.map((word, index) => {
    const duration = index === words.length - 1
      ? start + 0.04 + span - cursor
      : (span * weights[index]) / total
    const timing = { text: word, start: cursor, end: cursor + Math.max(0.02, duration) }
    cursor += duration
    return timing
  })
}

const MIN_CHAR_DURATION = 0.06

/**
 * Align every character of a line to a detected vocal onset.
 *
 * Chinese pop lines are sung roughly one syllable per character, so the expected
 * position of character i is a monotonic ramp from the line start. Each character
 * then greedily snaps to the nearest still-unused onset inside a tolerance window.
 * This preserves musical attacks instead of merely dividing the line evenly.
 */
function alignGraphemes(line: LyricLine, onsets: number[]): GraphemeTiming[] | undefined {
  const chars = graphemes(line.text)
  if (chars.length === 0) return undefined
  const windowStart = line.start - 0.18
  const windowEnd = line.end + 0.08
  const candidates = onsets.filter((time) => time >= windowStart && time <= windowEnd)
  if (candidates.length === 0) return undefined

  // Pop vocals sit around 3–5 characters per second; cap the ramp so a long
  // instrumental tail after the last syllable cannot drag characters outward.
  const span = Math.max(0.35, Math.min(line.end - line.start, chars.length * 0.24))
  const expected = chars.map((_, index) => line.start + (chars.length === 1 ? 0 : (span * index) / (chars.length - 1)))
  const tolerance = Math.max(0.2, Math.min(0.42, (span / Math.max(1, chars.length)) * 1.35))
  const times: number[] = []
  let cursor = 0
  for (let index = 0; index < chars.length; index++) {
    const target = expected[index]
    let best = -1
    let bestDistance = Number.POSITIVE_INFINITY
    for (let probe = cursor; probe < candidates.length; probe++) {
      const distance = Math.abs(candidates[probe] - target)
      if (distance < bestDistance) {
        bestDistance = distance
        best = probe
      }
      if (candidates[probe] > target + tolerance) break
    }
    if (best >= 0 && bestDistance <= tolerance) {
      times.push(candidates[best])
      cursor = best + 1
    } else {
      times.push(Number.NaN)
    }
  }

  // Fall back to the expected ramp (pulled between the nearest real anchors)
  // so a missing attack never stretches the tail of the line to the next lyric.
  for (let index = 0; index < times.length; index++) {
    if (Number.isFinite(times[index])) continue
    let previous = index - 1
    while (previous >= 0 && !Number.isFinite(times[previous])) previous--
    let next = index + 1
    while (next < times.length && !Number.isFinite(times[next])) next++
    const ramp = expected[index]
    const from = previous >= 0 ? times[previous] : ramp
    const to = next < times.length ? times[next] : ramp
    const ratio = (index - previous) / Math.max(1, next - previous)
    times[index] = previous < 0 && next >= times.length ? ramp : from + (to - from) * ratio
  }

  for (let index = 1; index < times.length; index++) {
    if (times[index] <= times[index - 1]) times[index] = times[index - 1] + MIN_CHAR_DURATION
  }
  const start = Math.max(line.start, times[0])
  const tail = Math.max(times[times.length - 1] + 0.18, expected[chars.length - 1] + 0.24)
  const lastEnd = Math.min(line.end, Math.max(tail, start + 0.25))
  const timings: GraphemeTiming[] = chars.map((text, index) => {
    const charStart = Math.max(line.start, times[index])
    const charEnd = index === chars.length - 1
      ? Math.max(charStart + MIN_CHAR_DURATION, lastEnd)
      : Math.max(charStart + MIN_CHAR_DURATION, Math.min(times[index + 1], line.end))
    return {
      text,
      start: charStart,
      end: charEnd,
      isEstimated: false,
      hasReliableStart: true,
      hasReliableEnd: index === chars.length - 1,
    }
  })
  return timings
}

/** Expand enhanced-LRC word tags into per-character timing. */
function alignWordTags(text: string, words: ParsedLrcWord[] | undefined, lineEnd: number): GraphemeTiming[] | undefined {
  if (!words || words.length === 0) return undefined
  const chars = graphemes(text)
  if (chars.length === 0) return undefined
  // Locate each tagged word inside the display line, then spread the word duration
  // across its own characters. Words not covered by a tag inherit the line timing.
  const timings: Array<GraphemeTiming | undefined> = new Array(chars.length)
  let searchFrom = 0
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex]
    const from = text.indexOf(word.text, searchFrom)
    if (from < 0) continue
    searchFrom = from + word.text.length
    const startChar = graphemes(text.slice(0, from)).length
    const count = graphemes(word.text).length
    if (count === 0) continue
    const nextTime = Math.min(lineEnd, Math.max(word.time + 0.06, words[wordIndex + 1]?.time ?? lineEnd))
    for (let offset = 0; offset < count; offset++) {
      const index = startChar + offset
      if (index >= chars.length) break
      timings[index] = {
        text: chars[index],
        start: word.time + ((nextTime - word.time) * offset) / count,
        end: word.time + ((nextTime - word.time) * (offset + 1)) / count,
        isEstimated: false,
        hasReliableStart: offset === 0,
        hasReliableEnd: offset === count - 1,
      }
    }
  }
  const first = timings.find(Boolean)
  if (!first) return undefined
  let previous = first
  for (let index = 0; index < chars.length; index++) {
    const timing = timings[index]
    if (timing) {
      previous = timing
      continue
    }
    const start = Math.max(previous.end, first.start)
    timings[index] = {
      text: chars[index],
      start,
      end: start + 0.06,
      isEstimated: true,
      hasReliableStart: false,
      hasReliableEnd: false,
    }
    previous = timings[index]!
  }
  return timings as GraphemeTiming[]
}

function toLines(
  entries: Array<{ time: number; text: string; words?: ParsedLrcWord[] }>,
  duration: number,
  title: string,
  artist: string,
  onsets: number[],
  preferOnsets: boolean,
): LyricLine[] {
  const filtered = entries
    .map((entry) => ({ time: Math.max(0, entry.time), text: entry.text.trim(), words: entry.words }))
    .filter((entry) => entry.text && !isCredit(entry.text, title, artist))
  const lines: LyricLine[] = []
  filtered.forEach((entry, index) => {
    const nextStart = filtered[index + 1]?.time ?? duration
    const start = Math.min(entry.time, Math.max(0, duration - 0.8))
    let end = Math.min(nextStart - 0.15, start + 6, duration - 0.05)
    if (end <= start + 0.5) end = Math.min(duration - 0.05, start + Math.max(0.8, Math.min(1.5, nextStart - start - 0.05)))
    if (end <= start + 0.1) return
    const line: LyricLine = {
      text: entry.text,
      start,
      end,
      renderEnd: end,
      words: makeWords(entry.text, start, end),
    }
    // Enhanced LRC word tags are authored timings and always win. Plain LRC still
    // gets acoustic per-character alignment from the audio onsets.
    const wordTimings = alignWordTags(entry.text, entry.words, end)
    if (wordTimings) line.graphemeTimings = wordTimings
    else if (preferOnsets) {
      const onsetsForLine = alignGraphemes(line, onsets)
      if (onsetsForLine) line.graphemeTimings = onsetsForLine
    }
    lines.push(line)
  })
  return lines
}

function plainLines(text: string, duration: number, title: string, artist: string): Array<{ time: number; text: string }> {
  const raw = text.split('\n').map((line) => line.trim()).filter((line) => line && !isCredit(line, title, artist))
  if (raw.length === 0) return []
  const totalWeight = raw.reduce((sum, line) => sum + Math.max(1, graphemes(line).length), 0)
  const available = Math.max(2, duration - 2)
  let cursor = 1
  return raw.map((line) => {
    const weight = Math.max(1, graphemes(line).length)
    const time = cursor
    cursor += Math.max(0.8, (available * weight) / totalWeight)
    return { time, text: line }
  })
}

type LyricEntry = { time: number; text: string; words?: ParsedLrcWord[] }
type LyricSelection = { entries: LyricEntry[]; source: string; timed: boolean }

function selectLyrics(metadata: IAudioMetadata, externalLrc?: string): LyricSelection {
  if (externalLrc && externalLrc.trim()) {
    const parsed = parseLrc(externalLrc)
    if (parsed.lines.length > 0) {
      return {
        entries: parsed.lines.map((line) => ({ time: line.time, text: line.text, words: line.words })),
        source: parsed.hasWordTimestamps ? 'IMPORTED LRC / WORD-TIMED' : parsed.hasTimestamps ? 'IMPORTED LRC' : 'IMPORTED LYRICS / PLAIN',
        timed: parsed.hasTimestamps,
      }
    }
  }
  const lyrics = metadata.common.lyrics ?? []
  const synced = lyrics.find((entry: ILyricsTag) => entry.syncText && entry.syncText.length > 0)
  if (synced) {
    const divisor = synced.timeStampFormat === 1 ? 75 : 1000
    return {
      entries: synced.syncText.map((item) => ({ time: (item.timestamp ?? 0) / divisor, text: item.text })),
      source: 'ID3 SYLT',
      timed: true,
    }
  }
  let best: { entries: LyricEntry[]; timed: boolean; wordTimed: boolean } | null = null
  for (const entry of lyrics) {
    if (!entry.text) continue
    const parsed = parseLrc(entry.text)
    if (parsed.hasTimestamps) {
      const candidate = {
        entries: parsed.lines.map((line) => ({ time: line.time, text: line.text, words: line.words })),
        timed: true,
        wordTimed: parsed.hasWordTimestamps,
      }
      if (!best || candidate.entries.length > best.entries.length) best = candidate
    } else if (!best) {
      best = { entries: parsed.lines.map((line) => ({ time: Number.NaN, text: line.text })), timed: false, wordTimed: false }
    }
  }
  if (!best) return { entries: [], source: 'NO LYRIC TAG', timed: false }
  return {
    entries: best.entries,
    timed: best.timed,
    source: best.timed ? (best.wordTimed ? 'ID3 USLT / WORD-TIMED LRC' : 'ID3 USLT / LRC') : 'ID3 USLT / PLAIN',
  }
}

export function buildTrackFromMetadata(
  metadata: IAudioMetadata,
  durationHint = 0,
  onsets: number[] = [],
  externalLrc?: string,
): ImportedLyrics {
  const duration = metadata.format.duration ?? durationHint ?? 0
  const title = metadata.common.title?.trim() || '未知曲目'
  const artist = metadata.common.artist?.trim() || metadata.common.artists?.[0]?.trim() || '未知艺术家'
  const album = metadata.common.album?.trim() || ''
  const selected = selectLyrics(metadata, externalLrc)
  const entries = selected.timed
    ? selected.entries
    : plainLines(selected.entries.map((entry) => entry.text).join('\n'), duration, title, artist)
  const lines = toLines(entries, duration, title, artist, onsets, true)
  const aligned = lines.filter((line) => line.graphemeTimings).length
  const lyricText = lines.map((line) => line.text).join('|')
  const seed = `mp3:${hashString(`${title}|${artist}|${album}|${lyricText}`).toString(16)}`
  const program = lines.length > 0
    ? compileProgram(lines, seed)
    : compileProgram([{ text: '♪', start: 0, end: duration, words: [{ text: '♪', start: 0, end: duration }] }], seed)
  const firstStart = lines[0]?.start ?? 0
  const previewTime = Math.min(Math.max(0.4, firstStart + 1.2), Math.max(0.4, duration - 1))
  const picture = metadata.common.picture?.[0]
  return {
    title,
    artist,
    album,
    duration,
    lines,
    program,
    seed,
    source: lines.length > 0 ? selected.source : 'INSTRUMENTAL / STAFF',
    timed: lines.length > 0 && selected.timed,
    aligned,
    previewTime,
    cover: picture ? { data: picture.data, format: picture.format } : undefined,
  }
}
