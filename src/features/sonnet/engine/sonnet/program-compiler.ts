import { clamp } from '../math'
import { hashString } from '../random'
import { analyzeLines } from './segmentation'
import type {
  AnimationCue,
  CompiledLine,
  LyricLine,
  Paragraph,
  ParagraphBoundary,
  ParagraphKind,
  Program,
  Shot,
  ShotKind,
  Transition,
  TransitionKind,
} from './types'

export const shotKinds: ShotKind[] = ['editorial', 'impact', 'collage', 'ribbon', 'mask', 'poster', 'quiet']
export const transitionKinds: TransitionKind[] = ['fast-blur', 'mono-glitch', 'camera-pull']

function chooseWithoutRepeat<T>(choices: T[], seed: string, previous: T | null): T {
  const start = hashString(seed) % choices.length
  for (let offset = 0; offset < choices.length; offset++) {
    const candidate = choices[(start + offset) % choices.length]
    if (previous === null || candidate !== previous) return candidate
  }
  return choices[start]
}

export function compileProgram(lines: LyricLine[], seed: string): Program {
  const analyses = analyzeLines(lines)
  const compiled = analyses.map((entry, index) => ({
    ...entry,
    renderEndTime: Math.max(
      entry.line.start,
      Math.min(
        entry.line.renderEnd ?? entry.line.end,
        index + 1 < analyses.length ? analyses[index + 1].line.start : Number.POSITIVE_INFINITY,
      ),
    ),
  }))
  if (compiled.length === 0) return { seed, paragraphGapThreshold: 1.25, paragraphs: [] }
  const threshold = resolveParagraphGapThreshold(compiled)
  const drafts = splitParagraphs(compiled, threshold)
  let previousShot: ShotKind | null = null
  let previousTransition: TransitionKind | null = null
  const paragraphs: Paragraph[] = []

  for (let index = 0; index < drafts.length; index++) {
    const draft = drafts[index]
    const kind = classifyParagraph(draft.lines, index, drafts.length)
    const shots = buildShots(draft.lines, kind, index, seed, previousShot)
    previousShot = shots[shots.length - 1]?.kind ?? previousShot
    const endTime = draft.lines[draft.lines.length - 1].renderEndTime
    let transition: Transition | null = null
    if (index + 1 < drafts.length) {
      const nextStart = drafts[index + 1].lines[0].line.start
      const transitionKind: TransitionKind = chooseWithoutRepeat(transitionKinds, `${seed}:${index}:transition`, previousTransition)
      previousTransition = transitionKind
      const gap = nextStart - endTime
      const duration = Math.min(0.3, Math.max(0.16, gap > 0 ? gap * 0.5 : 0.2))
      transition = {
        kind: transitionKind,
        startTime: Math.max(draft.lines[0].line.start, nextStart - duration),
        endTime: nextStart,
      }
    }
    paragraphs.push({
      id: `sonnet-p${index}`,
      kind,
      boundary: draft.boundary,
      startTime: draft.lines[0].line.start,
      endTime,
      lines: draft.lines,
      shots,
      transitionOut: transition,
    })
  }
  return { seed, paragraphGapThreshold: threshold, paragraphs }
}

export function resolveParagraphGapThreshold(lines: CompiledLine[]): number {
  const gaps = lines
    .slice(1)
    .map((line, index) => line.line.start - Math.min(lines[index].renderEndTime, line.line.start))
    .filter((gap) => gap > 0)
    .sort((a, b) => a - b)
  const median = gaps.length === 0
    ? 0.5
    : gaps.length % 2 === 0
      ? (gaps[gaps.length / 2 - 1] + gaps[gaps.length / 2]) / 2
      : gaps[Math.floor(gaps.length / 2)]
  return clamp(median * 2.5, 1.25, 3.5)
}

export function findParagraphIndexAtTime(program: Program, time: number): number {
  for (let index = program.paragraphs.length - 1; index >= 0; index--) {
    if (time >= program.paragraphs[index].startTime) return index
  }
  return 0
}

interface ParagraphDraft {
  lines: CompiledLine[]
  boundary: ParagraphBoundary
}

function splitParagraphs(lines: CompiledLine[], threshold: number): ParagraphDraft[] {
  const initial: ParagraphDraft[] = []
  let current: CompiledLine[] = []
  let boundary: ParagraphBoundary = 'song-start'
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    if (index > 0) {
      const previous = lines[index - 1]
      const metadata =
        (previous.line.blockIndex !== undefined && line.line.blockIndex !== undefined && previous.line.blockIndex !== line.line.blockIndex) ||
        (previous.line.songPart !== undefined && line.line.songPart !== undefined && previous.line.songPart !== line.line.songPart)
      const nextBoundary: ParagraphBoundary | null = metadata
        ? 'metadata'
        : line.line.start - previous.renderEndTime >= threshold
          ? 'time-gap'
          : null
      if (nextBoundary && current.length > 0) {
        initial.push({ lines: current, boundary })
        current = []
        boundary = nextBoundary
      }
    }
    current.push(line)
  }
  if (current.length > 0) initial.push({ lines: current, boundary })

  const output: ParagraphDraft[] = []
  for (const draft of initial) {
    let remaining = draft.lines.slice()
    let draftBoundary = draft.boundary
    while (
      remaining.length > 6 ||
      (remaining.length > 1 && remaining[remaining.length - 1].renderEndTime - remaining[0].line.start > 18)
    ) {
      let split = Math.min(4, remaining.length - 1)
      const candidates: Array<{ index: number; gap: number }> = []
      for (let index = 2; index <= remaining.length - 2; index++)
        candidates.push({ index, gap: remaining[index].line.start - remaining[index - 1].renderEndTime })
      candidates.sort((a, b) => b.gap - a.gap)
      if (candidates.length > 0) split = candidates[0].index
      output.push({ lines: remaining.slice(0, split), boundary: draftBoundary })
      remaining = remaining.slice(split)
      draftBoundary = split >= 6 ? 'line-cap' : 'duration-cap'
    }
    output.push({ lines: remaining, boundary: draftBoundary })
  }
  return output
}

function classifyParagraph(lines: CompiledLine[], index: number, total: number): ParagraphKind {
  if (lines.some((line) => line.line.isChorus || contains(line.line.songPart, 'chorus', '副歌'))) return 'chorus'
  if (lines.some((line) => contains(line.line.songPart, 'bridge', 'break', '間奏', 'ブリッジ'))) return 'break'
  if (index === total - 1) return 'outro'
  const duration = lines[lines.length - 1].renderEndTime - lines[0].line.start
  const words = lines.reduce((sum, line) => sum + line.segments.reduce((count, segment) => count + segment.lexicalWords.length, 0), 0)
  const punctuation = lines.reduce((sum, line) => sum + Array.from(line.line.text).filter((char) => '!?！？…'.includes(char)).length, 0)
  if (duration <= 3.5 || words <= 3) return 'breath'
  if (punctuation >= 2 || words / Math.max(duration, 1) > 2.5) return 'lift'
  return 'verse'
}

function buildShots(
  lines: CompiledLine[],
  paragraphKind: ParagraphKind,
  paragraphIndex: number,
  seed: string,
  previousShot: ShotKind | null,
): Shot[] {
  const groups: CompiledLine[][] = []
  for (const line of lines) {
    const current = groups[groups.length - 1]
    if (!current || current.length >= 4 || line.renderEndTime - current[0].line.start > 6) groups.push([])
    groups[groups.length - 1].push(line)
  }
  const shots: Shot[] = []
  let previous = previousShot
  for (let shotIndex = 0; shotIndex < groups.length; shotIndex++) {
    const group = groups[shotIndex]
    const signature = group.map((line) => line.line.text).join('|')
    let kind = chooseWithoutRepeat(shotKinds, `${seed}:${paragraphIndex}:${shotIndex}:${signature}`, previous)
    const wordCount = group.reduce((sum, line) => sum + line.segments.reduce((count, segment) => count + segment.lexicalWords.length, 0), 0)
    if (paragraphKind === 'breath' && shotIndex === 0 && wordCount <= 2) kind = 'quiet'
    if (paragraphKind === 'chorus' && kind === 'quiet') kind = 'impact'
    previous = kind
    const random = hashString(`${seed}:${paragraphIndex}:${shotIndex}:camera`)
    const zoomRandom = ((random >> 16) & 255) / 255
    const [zoomBase, zoomSpan] = kind === 'poster'
      ? [1.02, 0.16]
      : kind === 'quiet'
        ? [1.12, 0.2]
        : [1.22, 0.26]
    const segments = group.flatMap((line) => line.segments).filter((segment) => segment.text.length > 0)
    const cues: AnimationCue[] = segments.map((segment, index) => ({
      at: segment.startTime,
      duration: Math.max(0.08, segment.endTime - segment.startTime),
      kind: index === segments.length - 1 ? 'accent' : 'enter',
      segmentStart: index,
      segmentEnd: index + 1,
    }))
    shots.push({
      id: `p${paragraphIndex}-s${shotIndex}`,
      kind,
      startTime: group[0].line.start,
      endTime: group[group.length - 1].renderEndTime,
      lineIndices: group.map((line) => line.sourceIndex),
      cues,
      camera: {
        x: ((random & 255) / 255) * 0.18 - 0.09,
        y: (((random >> 8) & 255) / 255) * 0.14 - 0.07,
        zoom: zoomBase + zoomRandom * zoomSpan,
        rotation: (((random >> 24) & 255) / 255 - 0.5) * 0.08,
      },
    })
  }
  return shots
}

function contains(value: string | undefined, ...candidates: string[]): boolean {
  return value !== undefined && candidates.some((candidate) => value.toLowerCase().includes(candidate.toLowerCase()))
}
