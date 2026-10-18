import { describe, expect, it } from 'vitest'
import { compileProgram } from '../../src/features/sonnet/engine/sonnet/program-compiler'
import { resolve } from '../../src/features/sonnet/engine/sonnet/transitions'
import { shotFrame } from '../../src/features/sonnet/engine/sonnet/motion'
import { buildGraphemeTimings, buildTextElements } from '../../src/features/sonnet/engine/sonnet/lyric-timeline'
import { analyzeLines } from '../../src/features/sonnet/engine/sonnet/segmentation'
import { findHeroIndex } from '../../src/features/sonnet/engine/sonnet/roles'
import type { LyricLine } from '../../src/features/sonnet/engine/sonnet/types'

function fixtureLine(index: number): LyricLine {
  const start = 0.4 + index * 2.35
  const end = start + 1.85
  const words = ['第一句', '沿着风', '走向海'].map((text, wordIndex, all) => ({
    text,
    start: start + (wordIndex / all.length) * 1.6,
    end: start + ((wordIndex + 1) / all.length) * 1.6,
  }))
  return { text: '第一句沿着风走向海', start, end, renderEnd: end + 0.2, words }
}

const fixtureLines = Array.from({ length: 12 }, (_, index) => fixtureLine(index))

function summary(seed: string, lines = fixtureLines): string {
  const program = compileProgram(lines, seed)
  return JSON.stringify(program.paragraphs.map((paragraph) => ({
    kind: paragraph.kind,
    start: paragraph.startTime.toFixed(4),
    end: paragraph.endTime.toFixed(4),
    transition: paragraph.transitionOut,
    shots: paragraph.shots.map((shot) => ({
      kind: shot.kind,
      start: shot.startTime.toFixed(4),
      end: shot.endTime.toFixed(4),
      camera: shot.camera,
      lines: shot.lineIndices,
    })),
  })))
}

describe('sonnet program compiler', () => {
  it('is deterministic for a given seed', () => {
    expect(summary('test-seed')).toBe(summary('test-seed'))
  })

  it('keeps paragraphs and shots inside the original limits', () => {
    const program = compileProgram(fixtureLines, 'test-seed')
    for (const paragraph of program.paragraphs) {
      expect(paragraph.lines.length).toBeLessThanOrEqual(6)
      expect(paragraph.endTime - paragraph.startTime).toBeLessThanOrEqual(18.001)
      for (const shot of paragraph.shots) {
        expect(shot.lineIndices.length).toBeLessThanOrEqual(4)
        expect(shot.endTime - shot.startTime).toBeLessThanOrEqual(6.001)
      }
    }
  })
})

describe('transitions', () => {
  it('reproduces FastBlur entry and exit curves', () => {
    const entryStart = resolve('fast-blur', true, 0, 12, true)
    expect(entryStart.alpha).toBeCloseTo(0.18, 5)
    expect(entryStart.blur).toBeCloseTo(14, 5)
    const entryEnd = resolve('fast-blur', true, 1, 12, true)
    expect(entryEnd.alpha).toBeCloseTo(1, 5)
    expect(entryEnd.blur).toBeCloseTo(0, 5)
    const exit = resolve('fast-blur', false, 1, 12, true)
    expect(exit.alpha).toBeCloseTo(0, 5)
    expect(exit.blur).toBeCloseTo(14, 5)
  })

  it('keeps MonoGlitch opaque until the final 14 percent', () => {
    const middle = resolve('mono-glitch', false, 0.5, 900, true)
    expect(middle.alpha).toBe(1)
    expect(middle.glitch).toBeGreaterThan(0)
    expect(middle.glitchSeed).toBeGreaterThan(0)
    const end = resolve('mono-glitch', false, 0.95, 900, true)
    expect(end.alpha).toBeLessThan(1)
  })

  it('downgrades MonoGlitch to FastBlur when glitch transitions are disabled', () => {
    const frame = resolve('mono-glitch', false, 0.5, 900, false)
    expect(frame.glitch).toBe(0)
    expect(frame.blur).toBeGreaterThan(0)
  })
})

describe('motion', () => {
  it('keeps the TypeImpact punch and settles', () => {
    const start = shotFrame('impact', 0)
    const end = shotFrame('impact', 1)
    expect(start.scale).toBeGreaterThan(1.2)
    expect(end.scale).toBeGreaterThan(1)
    expect(end.scale).toBeLessThan(1.12)
  })

  it('keeps camera positions finite for every shot kind', () => {
    for (const kind of ['editorial', 'impact', 'collage', 'ribbon', 'mask', 'poster', 'quiet'] as const) {
      for (const progress of [0, 0.25, 0.5, 0.9, 1, 1.8]) {
        const frame = shotFrame(kind, progress)
        expect(Number.isFinite(frame.x)).toBe(true)
        expect(Number.isFinite(frame.y)).toBe(true)
        expect(Number.isFinite(frame.scale)).toBe(true)
        expect(Number.isFinite(frame.rotation)).toBe(true)
      }
    }
  })
})

describe('lyric timeline and semantics', () => {
  const line: LyricLine = {
    text: '月亮失眠',
    start: 10,
    end: 12,
    words: [
      { text: '月亮', start: 10, end: 10.8 },
      { text: '失眠', start: 10.8, end: 12 },
    ],
  }

  it('maps word timing to grapheme timing without gaps', () => {
    const elements = buildTextElements(line.text)
    const timings = buildGraphemeTimings(line, elements)
    expect(timings).toHaveLength(4)
    expect(timings[0].start).toBeCloseTo(10, 5)
    expect(timings[3].end).toBeCloseTo(12, 5)
    for (let index = 1; index < timings.length; index++) {
      expect(timings[index].start).toBeGreaterThanOrEqual(timings[index - 1].start)
      expect(timings[index].end).toBeGreaterThan(timings[index].start)
    }
  })

  it('interpolates untimed text inside the line window', () => {
    const openLine: LyricLine = { text: '如果星星也有归期', start: 3, end: 6, words: [] }
    const timings = buildGraphemeTimings(openLine, buildTextElements(openLine.text))
    expect(timings[0].start).toBeCloseTo(3, 5)
    expect(timings[timings.length - 1].end).toBeCloseTo(6, 5)
    expect(timings.every((timing) => timing.isEstimated)).toBe(true)
  })

  it('never promotes a function word to hero', () => {
    const line: LyricLine = {
      text: '如果星星也有归期',
      start: 0,
      end: 2,
      words: [
        { text: '如果', start: 0, end: 0.3 },
        { text: '星星', start: 0.3, end: 0.8 },
        { text: '也有', start: 0.8, end: 1.2 },
        { text: '归期', start: 1.2, end: 2 },
      ],
    }
    const compiled = analyzeLines([line])
    const hero = findHeroIndex(compiled[0].segments)
    expect(hero).toBeGreaterThanOrEqual(0)
    expect(compiled[0].segments[hero].emphasis.priority).toBeGreaterThan(0)
    expect(compiled[0].segments[hero].text).not.toBe('如果')
  })
})
