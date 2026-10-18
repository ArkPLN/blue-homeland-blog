import type { SegmentRole, SemanticSegment } from './types'
import { visibleLength } from './segmentation'

export function isEmphasis(role: SegmentRole): boolean {
  return role === 'hero' || role === 'semi-hero'
}

export function resolveFontWeight(configured: number | null, role: SegmentRole): number {
  if (configured !== null) {
    const clamped = Math.min(900, Math.max(100, configured))
    return Math.round(clamped / 10) * 10
  }
  if (isEmphasis(role)) return 900
  return role === 'decoration' ? 300 : 700
}

export function canEmphasize(segment: SemanticSegment): boolean {
  return segment.isWordLike && visibleLength(segment) > 0 && segment.emphasis.priority > 0
}

export function compareCandidates(left: SemanticSegment, right: SemanticSegment): number {
  if (left.emphasis.priority !== right.emphasis.priority) return left.emphasis.priority - right.emphasis.priority
  if (left.emphasis.reliableDurationPerGrapheme !== right.emphasis.reliableDurationPerGrapheme)
    return left.emphasis.reliableDurationPerGrapheme - right.emphasis.reliableDurationPerGrapheme
  return left.emphasis.occurrences - right.emphasis.occurrences
}

export function findHeroIndex(segments: SemanticSegment[]): number {
  let best = -1
  for (let index = 0; index < segments.length; index++) {
    if (canEmphasize(segments[index]) && (best < 0 || compareCandidates(segments[index], segments[best]) > 0)) best = index
  }
  return best
}

export function hasDisplayGap(segments: SemanticSegment[], left: number, right: number): boolean {
  for (let index = Math.min(left, right) + 1; index < Math.max(left, right); index++) {
    if (segments[index].text.trim().length > 0) return true
  }
  return false
}

export function findSemiHeroIndices(segments: SemanticSegment[], heroIndex: number): number[] {
  if (heroIndex < 0 || heroIndex >= segments.length || !canEmphasize(segments[heroIndex])) return []
  const candidates = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment, index }) => index !== heroIndex && canEmphasize(segment) && hasDisplayGap(segments, index, heroIndex))
    .sort((a, b) => {
      const comparison = compareCandidates(b.segment, a.segment)
      return comparison !== 0 ? comparison : a.index - b.index
    })
  const selected: number[] = []
  for (const candidate of candidates) {
    if (selected.some((index) => !hasDisplayGap(segments, index, candidate.index))) continue
    selected.push(candidate.index)
    if (selected.length === 2) break
  }
  return selected.sort((a, b) => a - b)
}
