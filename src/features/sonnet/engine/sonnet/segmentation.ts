import { buildGraphemeTimings, buildTextElements, splitGraphemes } from './lyric-timeline'
import { classifyWord, isContent, priorityOf } from './lexicon'
import type { CompiledLine, Emphasis, GraphemeTiming, LexicalWord, LyricLine, SemanticSegment } from './types'

interface RawLine {
  line: LyricLine
  elements: ReturnType<typeof buildTextElements>
  graphemes: GraphemeTiming[]
  words: Array<{ word: LexicalWord; graphemes: GraphemeTiming[] }>
}

function analyzeRaw(line: LyricLine): RawLine {
  const elements = buildTextElements(line.text)
  const graphemes = buildGraphemeTimings(line, elements)
  const offsetToElement = new Map<number, number>()
  elements.forEach((element, index) => offsetToElement.set(element.start, index))
  offsetToElement.set(line.text.length, elements.length)
  let searchFrom = 0
  const words: RawLine['words'] = []
  for (const timing of line.words) {
    if (!timing.text) continue
    const index = line.text.indexOf(timing.text, searchFrom)
    if (index < 0) continue
    const from = offsetToElement.get(index)
    const to = offsetToElement.get(index + timing.text.length)
    if (from === undefined || to === undefined || to <= from) continue
    const info = classifyWord(timing.text)
    words.push({
      word: {
        text: timing.text,
        startOffset: index,
        endOffset: index + timing.text.length,
        kind: info.kind,
        attachment: info.attachment,
      },
      graphemes: graphemes.slice(from, to),
    })
    searchFrom = index + timing.text.length
  }
  return { line, elements, graphemes, words }
}

function reliableDuration(graphemes: GraphemeTiming[]): number {
  if (graphemes.length === 0) return 0
  if (!graphemes.every((glyph) => !glyph.isEstimated)) return 0
  return graphemes.reduce((sum, glyph) => sum + Math.max(0, glyph.end - glyph.start), 0) / graphemes.length
}

function makeEmphasis(kind: LexicalWord['kind'], graphemes: GraphemeTiming[], occurrences: number): Emphasis {
  return {
    priority: priorityOf(kind),
    reliableDurationPerGrapheme: reliableDuration(graphemes),
    occurrences,
  }
}

export function analyzeLines(lines: LyricLine[]): CompiledLine[] {
  const raw = lines.map(analyzeRaw)
  const counts = new Map<string, number>()
  for (const entry of raw) {
    for (const word of entry.words) {
      if (!isContent(word.word.kind)) continue
      const key = word.word.text
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return raw.map((entry, sourceIndex) => {
    const segments: SemanticSegment[] = []
    for (const item of entry.words) {
      const core = item.word
      const first = item.graphemes[0]
      const last = item.graphemes[item.graphemes.length - 1]
      const isWordLike = isContent(core.kind) || core.kind === 'symbol'
      const occurrences = counts.get(core.text) ?? 1
      segments.push({
        text: core.text,
        startOffset: core.startOffset,
        endOffset: core.endOffset,
        startTime: first?.start ?? entry.line.start,
        endTime: last?.end ?? entry.line.end,
        wordIndices: [segments.length],
        graphemes: item.graphemes,
        isWordLike,
        lexicalWords: [core],
        coreStartOffset: core.startOffset,
        coreEndOffset: core.endOffset,
        emphasis: makeEmphasis(core.kind, item.graphemes, occurrences),
      })
    }
    // Keep punctuation-only and symbol lines usable by the staff and guide passes.
    if (segments.length === 0) {
      segments.push({
        text: entry.line.text,
        startOffset: 0,
        endOffset: entry.line.text.length,
        startTime: entry.line.start,
        endTime: entry.line.end,
        wordIndices: [],
        graphemes: entry.graphemes,
        isWordLike: false,
        lexicalWords: [],
        emphasis: { priority: 0, reliableDurationPerGrapheme: 0, occurrences: 1 },
      })
    }
    return {
      sourceIndex,
      line: entry.line,
      renderEndTime: entry.line.renderEnd ?? entry.line.end,
      segments,
    }
  })
}

export function visibleLength(segment: SemanticSegment): number {
  return segment.graphemes.filter((glyph) => glyph.text.trim().length > 0).length
}

export function graphemeCount(text: string): number {
  return splitGraphemes(text.trim()).length
}
