import type { GraphemeTiming, LyricLine } from './types'

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })
  : null

export function splitGraphemes(text: string): string[] {
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text)
}

export interface TextElement {
  text: string
  start: number
}

export function buildTextElements(text: string): TextElement[] {
  const elements: TextElement[] = []
  let cursor = 0
  for (const grapheme of splitGraphemes(text)) {
    elements.push({ text: grapheme, start: cursor })
    cursor += grapheme.length
  }
  return elements
}

/** Port of SonnetLyricTimeline: word timing -> grapheme timing with gap interpolation. */
export function buildGraphemeTimings(line: LyricLine, elements: TextElement[]): GraphemeTiming[] {
  const result: Array<GraphemeTiming | undefined> = new Array(elements.length)
  const startTime = Number.isFinite(line.start) ? Math.max(0, line.start) : 0
  const endTime = Number.isFinite(line.end) ? Math.max(startTime, line.end) : startTime
  if (line.graphemeTimings && line.graphemeTimings.length === elements.length) {
    return line.graphemeTimings.map((timing, index) => ({ ...timing, text: elements[index].text }))
  }
  const offsetToElement = new Map<number, number>()
  elements.forEach((element, index) => offsetToElement.set(element.start, index))
  offsetToElement.set(line.text.length, elements.length)

  let cursor = 0
  for (let wordIndex = 0; wordIndex < line.words.length && cursor < elements.length; wordIndex++) {
    const word = line.words[wordIndex]
    if (!word.text || !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.end < word.start) continue
    let searchOffset = elements[cursor].start
    let from = -1
    let to = -1
    while (searchOffset < line.text.length) {
      const match = line.text.indexOf(word.text, searchOffset)
      if (match < 0) break
      const fromCandidate = offsetToElement.get(match)
      const toCandidate = offsetToElement.get(match + word.text.length)
      if (fromCandidate !== undefined && toCandidate !== undefined) {
        from = fromCandidate
        to = toCandidate
        break
      }
      from = -1
      to = -1
      searchOffset = match + 1
    }
    if (from < cursor || to <= from) continue
    const wordStart = Math.min(endTime, Math.max(startTime, word.start))
    const wordEnd = Math.min(endTime, Math.max(wordStart, word.end))
    const count = to - from
    const adjusted = wordStart !== word.start || wordEnd !== word.end
    for (let index = from; index < to; index++) {
      result[index] = {
        text: elements[index].text,
        start: wordStart + ((wordEnd - wordStart) * (index - from)) / count,
        end: index + 1 === to ? wordEnd : wordStart + ((wordEnd - wordStart) * (index - from + 1)) / count,
        wordIndex,
        isEstimated: count > 1 || adjusted,
        hasReliableStart: index === from && !adjusted,
        hasReliableEnd: index + 1 === to && !adjusted,
      }
    }
    cursor = to
  }

  for (let index = 0; index < result.length;) {
    if (result[index]) { index++; continue }
    const from = index
    while (index < result.length && !result[index]) index++
    let gapStart = from > 0 ? result[from - 1]!.end : startTime
    const gapEnd = index < result.length ? result[index]!.start : endTime
    gapStart = Math.min(gapStart, gapEnd)
    for (let inner = from; inner < index; inner++) {
      result[inner] = {
        text: elements[inner].text,
        start: gapStart + ((gapEnd - gapStart) * (inner - from)) / (index - from),
        end: gapStart + ((gapEnd - gapStart) * (inner - from + 1)) / (index - from),
        isEstimated: true,
        hasReliableStart: false,
        hasReliableEnd: false,
      }
    }
  }

  return result.map((timing, index) => timing ?? {
    text: elements[index].text,
    start: startTime,
    end: endTime,
    isEstimated: true,
    hasReliableStart: false,
    hasReliableEnd: false,
  })
}
