import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { parseFile } from 'music-metadata'
import type { IAudioMetadata } from 'music-metadata'
import { buildTrackFromMetadata } from '../../src/features/sonnet/engine/mp3/lyrics'
import { parseLrc } from '../../src/features/sonnet/engine/mp3/lrc'

const mp3Path = resolve(process.cwd(), 'public/media/qingmingshanghetu')
let metadata: IAudioMetadata
let built: ReturnType<typeof buildTrackFromMetadata>

beforeAll(async () => {
  metadata = await parseFile(mp3Path, { duration: true })
  built = buildTrackFromMetadata(metadata)
})

describe('MP3 / ID3 lyric import', () => {
  it('reads title, artist, album, duration and cover art from the MP3', () => {
    expect(metadata.common.title).toContain('清明上河图')
    expect(metadata.common.artist).toBe('颜小亿')
    expect(metadata.format.duration).toBeGreaterThan(200)
    expect(metadata.common.picture?.[0]?.format).toMatch(/jpeg|jpg|png/i)
    expect((metadata.common.picture?.[0]?.data.length ?? 0)).toBeGreaterThan(1000)
  })

  it('extracts timed lyrics and drops credit lines', () => {
    expect(built.lines.length).toBeGreaterThan(30)
    expect(built.timed).toBe(true)
    expect(built.source).toContain('USLT')
    expect(built.lines[0].text).toContain('我俯身看去')
    expect(built.lines[0].start).toBeCloseTo(0.45, 1)
    expect(built.lines.some((line) => /作词|作曲|演唱|编曲/.test(line.text))).toBe(false)
    expect(built.lines.some((line) => line.text.includes('清明上河图'))).toBe(false)
  })

  it('compiles a program directly from the imported lyrics', () => {
    const kinds = new Set(built.program.paragraphs.flatMap((paragraph) => paragraph.shots.map((shot) => shot.kind)))
    expect(built.program.paragraphs.length).toBeGreaterThan(1)
    expect(kinds.size).toBe(7)
    expect(built.program.paragraphs[0].lines[0].line.text).toBe(built.lines[0].text)
    expect(built.seed).toMatch(/^mp3:/)
  })

  it('changes the animation program when the lyrics change', () => {
    const firstLyric = metadata.common.lyrics?.[0]
    expect(firstLyric?.text).toBeTruthy()
    const changedText = firstLyric!.text!.replace('我俯身看去', '今天换上一段完全不同的新歌词')
    const changed: IAudioMetadata = {
      ...metadata,
      common: {
        ...metadata.common,
        lyrics: [{ ...firstLyric!, text: changedText }],
      },
    }
    const changedTrack = buildTrackFromMetadata(changed)
    expect(changedTrack.seed).not.toBe(built.seed)
    expect(changedTrack.lines[0].text).not.toBe(built.lines[0].text)
    expect(JSON.stringify(changedTrack.program.paragraphs.map((paragraph) => paragraph.shots.map((shot) => shot.kind))))
      .not.toBe(JSON.stringify(built.program.paragraphs.map((paragraph) => paragraph.shots.map((shot) => shot.kind))))
  })

  it('snaps characters to nearby audio onsets when they are supplied', () => {
    const line = built.lines[0]
    const onsets: number[] = []
    for (let time = 0.4; time < 3.2; time += 0.19) onsets.push(Math.round(time * 1000) / 1000)
    const aligned = buildTrackFromMetadata(metadata, 0, onsets)
    const alignedLine = aligned.lines[0]
    expect(aligned.aligned).toBeGreaterThan(0)
    expect(alignedLine.graphemeTimings?.length).toBe(Array.from(line.text).length)
    const starts = alignedLine.graphemeTimings!.map((timing) => timing.start)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
    const snapped = starts.filter((start) => onsets.some((onset) => Math.abs(onset - start) < 0.03)).length
    expect(snapped).toBeGreaterThanOrEqual(Math.floor(starts.length * 0.7))
    // Different audio attacks must produce different per-character timing.
    const shifted = buildTrackFromMetadata(metadata, 0, onsets.map((time) => time + 0.07))
    expect(shifted.lines[0].graphemeTimings![0].start).not.toBe(alignedLine.graphemeTimings![0].start)
  })

  it('keeps the file on disk parseable and non-empty', () => {
    const bytes = readFileSync(mp3Path)
    expect(bytes.length).toBeGreaterThan(1_000_000)
    expect(bytes.subarray(0, 3).toString('latin1')).toBe('ID3')
  })
})

describe('LRC parser', () => {
  it('handles multiple timestamps, offset and metadata', () => {
    const parsed = parseLrc('[ti:Test]\n[offset:500]\n[00:01.00][00:03.50]同一句歌词\n[00:05.25]下一句')
    expect(parsed.metadata.ti).toBe('Test')
    expect(parsed.offsetMs).toBe(500)
    expect(parsed.hasTimestamps).toBe(true)
    expect(parsed.lines).toHaveLength(3)
    expect(parsed.lines[0].time).toBeCloseTo(1.5, 3)
    expect(parsed.lines[1].time).toBeCloseTo(4, 3)
    expect(parsed.lines[2].text).toBe('下一句')
  })

  it('detects plain text without timestamps', () => {
    const parsed = parseLrc('第一行\n第二行')
    expect(parsed.hasTimestamps).toBe(false)
    expect(parsed.lines.map((line) => line.text)).toEqual(['第一行', '第二行'])
  })

  it('parses enhanced word timing tags', () => {
    const parsed = parseLrc('[00:10.00]<00:10.00>曾经<00:10.40>多少<00:11.10>次')
    expect(parsed.hasWordTimestamps).toBe(true)
    expect(parsed.lines[0].text).toBe('曾经多少次')
    expect(parsed.lines[0].words?.map((word) => word.text)).toEqual(['曾经', '多少', '次'])
    expect(parsed.lines[0].words?.[1].time).toBeCloseTo(10.4, 3)
  })

  it('parses the supplied 155910.lrc file', async () => {
    const { readFileSync } = await import('node:fs')
    const text = readFileSync(resolve(process.cwd(), 'tests/sonnet/fixtures/155910.lrc'), 'utf8')
    const parsed = parseLrc(text)
    expect(parsed.hasTimestamps).toBe(true)
    expect(parsed.lines.length).toBeGreaterThan(40)
    expect(parsed.lines[0].time).toBeCloseTo(0, 3)
    const firstSung = parsed.lines.find((line) => line.text.includes('曾经多少次跌倒在路上'))
    expect(firstSung?.time).toBeCloseTo(11.669, 3)
  })
})

describe('external LRC import', () => {
  it('prefers imported LRC over embedded ID3 lyrics', () => {
    const lrc = '[00:00.480]外部歌词第一句\n[00:06.000]外部歌词第二句\n[00:12.000]外部歌词第三句'
    const built = buildTrackFromMetadata(metadata, 0, [], lrc)
    expect(built.source).toContain('IMPORTED LRC')
    expect(built.lines[0].text).toBe('外部歌词第一句')
    expect(built.lines[0].start).toBeCloseTo(0.48, 2)
    expect(built.lines.length).toBe(3)
  })

  it('uses enhanced word tags for per-character timing instead of onsets', () => {
    const lrc = '[00:00.480]<00:00.480>我俯<00:00.900>身<00:01.400>看<00:02.000>去'
    const built = buildTrackFromMetadata(metadata, 0, [0.5, 1.5, 2.5], lrc)
    expect(built.lines[0].graphemeTimings?.length).toBe(Array.from(built.lines[0].text).length)
    expect(built.lines[0].graphemeTimings![0].start).toBeCloseTo(0.48, 2)
    expect(built.lines[0].graphemeTimings![3].start).toBeGreaterThan(0.4)
  })

  it('falls back to acoustic onsets for a plain line-level LRC', () => {
    const lrc = '[00:00.450]雕刻在石碑上的印记\n[00:06.000]那一帘秋雨'
    const onsets = [0.46, 0.68, 0.9, 1.12, 1.34, 1.56, 1.78, 2.0, 2.22, 2.44, 2.66]
    const built = buildTrackFromMetadata(metadata, 0, onsets, lrc)
    expect(built.lines[0].graphemeTimings?.length).toBe(Array.from(built.lines[0].text).length)
    const snapped = built.lines[0].graphemeTimings!.filter((timing) => onsets.some((onset) => Math.abs(onset - timing.start) < 0.03)).length
    expect(snapped).toBeGreaterThanOrEqual(6)
  })
})
