export interface Vec2 {
  x: number
  y: number
}

export type Mat2D = [number, number, number, number, number, number]

export const vec = (x = 0, y = 0): Vec2 => ({ x, y })
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))
export const clamp01 = (value: number): number => clamp(value, 0, 1)
export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t
export const lerpVec = (from: Vec2, to: Vec2, t: number): Vec2 => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
})
export const positiveModulo = (value: number, modulo: number): number =>
  ((value % modulo) + modulo) % modulo

export const identity: Mat2D = [1, 0, 0, 1, 0, 0]

export function multiply(a: Mat2D, b: Mat2D): Mat2D {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

export function transformPoint(matrix: Mat2D, point: Vec2): Vec2 {
  return {
    x: matrix[0] * point.x + matrix[2] * point.y + matrix[4],
    y: matrix[1] * point.x + matrix[3] * point.y + matrix[5],
  }
}

/** T(position) * R(rotation) * S(scale) * T(-pivot) */
export function nodeMatrix(
  position: Vec2,
  pivot: Vec2,
  scale: Vec2,
  rotation: number,
): Mat2D {
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const a = cos * scale.x
  const b = sin * scale.x
  const c = -sin * scale.y
  const d = cos * scale.y
  return [
    a,
    b,
    c,
    d,
    position.x - (a * pivot.x + c * pivot.y),
    position.y - (b * pivot.x + d * pivot.y),
  ]
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export interface PolygonPoint {
  x: number
  y: number
}

export function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}
