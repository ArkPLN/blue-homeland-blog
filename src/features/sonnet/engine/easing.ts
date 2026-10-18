import { clamp01 } from './math'

function cubic(p1: number, p2: number, time: number): number {
  const inverse = 1 - time
  return 3 * inverse * inverse * time * p1 + 3 * inverse * time * time * p2 + time * time * time
}

/** Sonnet's 12-step binary search cubic Bezier; do not replace with CSS easing. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number, value: number): number {
  const target = clamp01(value)
  if (target === 0 || target === 1) return target
  let low = 0
  let high = 1
  let parameter = target
  for (let iteration = 0; iteration < 12; iteration++) {
    if (cubic(x1, x2, parameter) < target) low = parameter
    else high = parameter
    parameter = (low + high) / 2
  }
  return cubic(y1, y2, parameter)
}

export const easeInOut = (value: number): number => cubicBezier(0.65, 0, 0.35, 1, value)
export const easeEnter = (value: number): number => cubicBezier(0.22, 1, 0.36, 1, value)
export const expoOut = (value: number): number =>
  value === 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, value))
export const elasticOut = (value: number): number => {
  const period = 0.3
  return Math.pow(2, -10 * value) * Math.sin(((value - period / 4) * (2 * Math.PI)) / period) + 1
}
