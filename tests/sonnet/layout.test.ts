import { describe, expect, it } from 'vitest'
import { resolveTypography } from '../../src/features/sonnet/engine/sonnet/typography-layout'
import type { SemanticSegment, ShotKind } from '../../src/features/sonnet/engine/sonnet/types'

function segment(text: string, start: number): SemanticSegment {
  const graphemes = Array.from(text).map((char, index) => ({
    text: char,
    start: start + index * 0.2,
    end: start + (index + 1) * 0.2,
    isEstimated: false,
    hasReliableStart: true,
    hasReliableEnd: true,
  }))
  return {
    text,
    startOffset: 0,
    endOffset: text.length,
    startTime: start,
    endTime: start + graphemes.length * 0.2,
    wordIndices: [0],
    graphemes,
    isWordLike: true,
    lexicalWords: [],
    emphasis: { priority: 3, reliableDurationPerGrapheme: 0.2, occurrences: 1 },
  }
}

const shotKinds: ShotKind[] = ['editorial', 'impact', 'collage', 'ribbon', 'mask', 'poster', 'quiet']

function overlapRatio(a: { x: number; y: number; measuredWidth: number; measuredHeight: number }, b: typeof a): number {
  const ox = Math.min(a.x + a.measuredWidth / 2, b.x + b.measuredWidth / 2) - Math.max(a.x - a.measuredWidth / 2, b.x - b.measuredWidth / 2)
  const oy = Math.min(a.y + a.measuredHeight / 2, b.y + b.measuredHeight / 2) - Math.max(a.y - a.measuredHeight / 2, b.y - b.measuredHeight / 2)
  if (ox <= 0 || oy <= 0) return 0
  return (ox * oy) / Math.min(a.measuredWidth * a.measuredHeight, b.measuredWidth * b.measuredHeight)
}

describe('typography collision handling', () => {
  const width = 1179
  const height = 429

  for (const kind of shotKinds) {
    it(`keeps ${kind} word blocks from overlapping`, () => {
      const lines = [
        [segment('如今我已不再感到彷徨', 0), segment('我想超越这平凡的生活', 2), segment('我想要怒放的生命', 4)],
      ]
      const { placements } = resolveTypography(lines, kind, width, height, 600, 1.37)
      const blocks = placements.filter((placement) => placement.role !== 'decoration')
      expect(blocks.length).toBeGreaterThan(1)
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          expect(overlapRatio(blocks[i], blocks[j])).toBeLessThan(0.02)
        }
      }
    })
  }

  it('keeps readable type sizes instead of shrinking to fit collisions', () => {
    const lines = [[segment('我想要怒放的生命', 0), segment('就像飞翔在辽阔天空', 2), segment('就像穿行在无边的旷野', 4)]]
    const { placements } = resolveTypography(lines, 'impact', width, height, 600, 1.4)
    const hero = placements.find((placement) => placement.role === 'hero')
    expect(hero).toBeDefined()
    // Fallback metrics in a headless run are slightly narrower than a real
    // browser; the important property is that type is not shrunk to fit.
    expect(hero!.fontSize).toBeGreaterThanOrEqual(48)
  })

  it('stays deterministic', () => {
    const lines = [[segment('我想要怒放的生命', 0), segment('就像飞翔在辽阔天空', 2)]]
    const first = resolveTypography(lines, 'collage', width, height, 600, 1.3)
    const second = resolveTypography(lines, 'collage', width, height, 600, 1.3)
    expect(JSON.stringify(first.placements)).toBe(JSON.stringify(second.placements))
  })
})
