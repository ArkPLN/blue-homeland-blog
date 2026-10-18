export interface ParsedLrcWord {
  time: number
  text: string
}

export interface ParsedLrcLine {
  time: number
  text: string
  /** Enhanced LRC `<mm:ss.xx>` word timings, when the file provides them. */
  words?: ParsedLrcWord[]
}

export interface ParsedLrc {
  lines: ParsedLrcLine[]
  offsetMs: number
  metadata: Record<string, string>
  hasTimestamps: boolean
  hasWordTimestamps: boolean
}

const timestampPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g
const wordTimestampPattern = /<(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?>/g

function fractionToSeconds(fraction: string | undefined): number {
  if (!fraction) return 0
  if (fraction.length === 1) return Number(fraction) / 10
  if (fraction.length === 2) return Number(fraction) / 100
  return Number(fraction) / 1000
}

function toSeconds(minutes: string, seconds: string, fraction?: string): number {
  return Number(minutes) * 60 + Number(seconds) + fractionToSeconds(fraction)
}

function parseWordTimings(text: string): ParsedLrcWord[] | undefined {
  wordTimestampPattern.lastIndex = 0
  const matches: Array<{ index: number; length: number; time: number }> = []
  let match: RegExpExecArray | null
  while ((match = wordTimestampPattern.exec(text)) !== null) {
    matches.push({ index: match.index, length: match[0].length, time: toSeconds(match[1], match[2], match[3]) })
  }
  if (matches.length === 0) return undefined
  const words: ParsedLrcWord[] = []
  for (let index = 0; index < matches.length; index++) {
    const current = matches[index]
    const nextIndex = index + 1 < matches.length ? matches[index + 1].index : text.length
    const value = text.slice(current.index + current.length, nextIndex).trim()
    if (value) words.push({ time: current.time, text: value })
  }
  return words.length > 0 ? words : undefined
}

/** Parse standard and enhanced LRC, including multiple tags per line and [offset:ms]. */
export function parseLrc(source: string): ParsedLrc {
  const metadata: Record<string, string> = {}
  let offsetMs = 0
  const lines: ParsedLrcLine[] = []
  let hasTimestamps = false
  let hasWordTimestamps = false
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')

  for (const rawLine of normalized.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue
    if (/^\[[a-zA-Z#]+:[^\]]*\]$/.test(trimmed)) {
      const key = trimmed.slice(1, trimmed.indexOf(':')).toLowerCase()
      const value = trimmed.slice(trimmed.indexOf(':') + 1, -1).trim()
      metadata[key] = value
      if (key === 'offset') offsetMs = Number(value) || 0
      continue
    }
    timestampPattern.lastIndex = 0
    const times: number[] = []
    let match: RegExpExecArray | null
    while ((match = timestampPattern.exec(trimmed)) !== null) {
      times.push(toSeconds(match[1], match[2], match[3]))
      hasTimestamps = true
    }
    const withoutLineTags = trimmed.replace(timestampPattern, '')
    if (times.length === 0) {
      const text = withoutLineTags.replace(wordTimestampPattern, '').trim()
      if (text) lines.push({ time: Number.NaN, text })
      continue
    }
    const words = parseWordTimings(withoutLineTags)
    if (words) hasWordTimestamps = true
    const text = withoutLineTags.replace(wordTimestampPattern, '').trim()
    if (!text) continue
    for (const time of times) lines.push({ time, text, words })
  }

  if (hasTimestamps) {
    lines.sort((a, b) => a.time - b.time)
    const shift = offsetMs / 1000
    for (const line of lines) {
      line.time = Math.max(0, line.time + shift)
      if (line.words) for (const word of line.words) word.time = Math.max(0, word.time + shift)
    }
  }
  return { lines, offsetMs, metadata, hasTimestamps, hasWordTimestamps }
}
