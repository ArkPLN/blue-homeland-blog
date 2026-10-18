import type { Vec2 } from '../../math'
import type { Color, SolidPrimitive } from '../../gl/types'
import { positiveModulo } from '../../math'

export const stroke = (
  points: Vec2[],
  width: number,
  color: Color,
  options: { closed?: boolean; dash?: number; gap?: number } = {},
): SolidPrimitive => ({
  kind: 'stroke',
  points,
  width,
  color,
  closed: options.closed,
  dash: options.dash,
  gap: options.gap,
})

export const poly = (points: Vec2[], color: Color): SolidPrimitive => ({ kind: 'poly', points, color })

export const circle = (cx: number, cy: number, radius: number, color: Color, options: { fill?: boolean; width?: number; segments?: number } = {}): SolidPrimitive => ({
  kind: 'circle',
  cx,
  cy,
  radius,
  color,
  fill: options.fill ?? false,
  width: options.width ?? 1,
  segments: options.segments,
})

export const rect = (x: number, y: number, width: number, height: number, color: Color): SolidPrimitive =>
  poly([{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }], color)

export const line = (x1: number, y1: number, x2: number, y2: number, width: number, color: Color): SolidPrimitive =>
  stroke([{ x: x1, y: y1 }, { x: x2, y: y2 }], width, color)

export const arcPoints = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments = 32,
  ry = radius,
): Vec2[] => {
  const points: Vec2[] = []
  for (let index = 0; index <= segments; index++) {
    const angle = startAngle + ((endAngle - startAngle) * index) / segments
    points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * ry })
  }
  return points
}

export const ellipsePoints = (cx: number, cy: number, rx: number, ry: number, segments = 48): Vec2[] =>
  arcPoints(cx, cy, rx, 0, Math.PI * 2, segments, ry)

export const dashedCircle = (
  cx: number,
  cy: number,
  radius: number,
  width: number,
  color: Color,
  dash: number,
  gap: number,
): SolidPrimitive => ({
  kind: 'stroke',
  points: arcPoints(cx, cy, radius, 0, Math.PI * 2, 160),
  width,
  color,
  dash,
  gap,
})

export const dashedEllipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  width: number,
  color: Color,
  dash: number,
  gap: number,
): SolidPrimitive => ({
  kind: 'stroke',
  points: ellipsePoints(cx, cy, rx, ry, 160),
  width,
  color,
  dash,
  gap,
})

export const hatch = (
  x: number,
  y: number,
  width: number,
  height: number,
  spacing: number,
  color: Color,
): SolidPrimitive[] => {
  const lines: SolidPrimitive[] = []
  for (let offset = -height; offset < width; offset += spacing)
    lines.push(line(x + offset, y + height, x + offset + height, y, 1, color))
  return lines
}

export const starPoints = (cx: number, cy: number, outer: number, inner: number, points: number, rotation = 0): Vec2[] => {
  const result: Vec2[] = []
  for (let index = 0; index < points * 2; index++) {
    const radius = index % 2 === 0 ? outer : inner
    const angle = rotation + (index / (points * 2)) * Math.PI * 2
    result.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return result
}

export const hexagon = (cx: number, cy: number, radius: number, rotation = 0): Vec2[] =>
  Array.from({ length: 6 }, (_, index) => ({
    x: cx + Math.cos(rotation + (index / 6) * Math.PI * 2) * radius,
    y: cy + Math.sin(rotation + (index / 6) * Math.PI * 2) * radius,
  }))

export const diamond = (cx: number, cy: number, rx: number, ry = rx): Vec2[] => [
  { x: cx, y: cy - ry },
  { x: cx + rx, y: cy },
  { x: cx, y: cy + ry },
  { x: cx - rx, y: cy },
]

export const seeded = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export const sym = (seed: number, index: number, salt: number): number =>
  positiveModulo(Math.imul(seed ^ salt, 2654435761 + index * 97), 1000) / 1000

export const withOpacity = (color: Color, factor: number): Color => ({ ...color, a: color.a * factor })
