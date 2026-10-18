import type { SegmentRole, SemanticSegment } from './types'

export interface TypographyPlacement {
  segmentIndex: number
  displayText: string
  role: SegmentRole
  fontScale: number
  measuredWidth: number
  measuredHeight: number
  x: number
  y: number
  rotation: number
  enterX: number
  enterY: number
  vertical: boolean
  phase: number
  layoutDirection: 'horizontal' | 'vertical'
  fontSize: number
}

export interface GlyphPlacement {
  text: string
  position: { x: number; y: number }
  entrance: { x: number; y: number }
  entryRotation: number
  startTime: number
  settleTime: number
}

export function resolveMotionDuration(start: number, end: number): number {
  const shotDuration = Math.max(0.001, end - start)
  const preferred = Math.min(1.8, Math.max(0.65, shotDuration * 0.42))
  return Math.min(preferred, shotDuration * 0.72)
}

export function buildGlyphs(
  segment: SemanticSegment,
  placement: TypographyPlacement,
  fontSize: number,
  measure: (text: string) => number,
  shotStart: number,
  shotEnd: number,
): GlyphPlacement[] {
  const graphemes = segment.graphemes.length > 0
    ? segment.graphemes
    : Array.from(segment.text).map((text, index) => ({
        text,
        start: segment.startTime + ((segment.endTime - segment.startTime) * index) / Math.max(1, Array.from(segment.text).length),
        end: segment.startTime + ((segment.endTime - segment.startTime) * (index + 1)) / Math.max(1, Array.from(segment.text).length),
        isEstimated: true,
        hasReliableStart: false,
        hasReliableEnd: false,
      }))
  const advances = graphemes.map((item) => placement.vertical ? fontSize * 0.9 : Math.max(fontSize * 0.2, measure(item.text)))
  let cursor = -advances.reduce((sum, value) => sum + value, 0) / 2
  const motionDuration = resolveMotionDuration(shotStart, shotEnd)
  const cosine = Math.cos(placement.rotation)
  const sine = Math.sin(placement.rotation)
  const output: GlyphPlacement[] = []
  for (let index = 0; index < graphemes.length; index++) {
    const advance = advances[index]
    const localX = placement.vertical ? 0 : cursor + advance / 2
    const localY = placement.vertical ? cursor + advance / 2 : 0
    cursor += advance
    const stagger = index % 2 === 0 ? -1 : 1
    const position = {
      x: placement.x + localX * cosine - localY * sine,
      y: placement.y + localX * sine + localY * cosine,
    }
    const entrance = {
      x: placement.enterX + (placement.vertical ? stagger * fontSize * 0.28 : 0),
      y: placement.enterY + (placement.vertical ? 0 : stagger * fontSize * 0.24),
    }
    const startTime = graphemes[index].start
    // Karaoke mode: when a character carries a real timestamp, its entrance must
    // resolve inside its own sung duration instead of the shot-wide 1.8 s ramp.
    const glyph = graphemes[index]
    const sung = Math.max(0.06, glyph.end - glyph.start)
    const localSettle = glyph.hasReliableStart && !glyph.isEstimated
      ? startTime + Math.min(motionDuration, Math.max(0.14, Math.min(sung, 0.7)))
      : startTime + motionDuration
    output.push({
      text: graphemes[index].text,
      position,
      entrance,
      entryRotation: stagger * (placement.role === 'hero' || placement.role === 'semi-hero' ? 0.055 : 0.035),
      startTime,
      settleTime: Math.max(startTime, localSettle),
    })
  }
  return output
}
