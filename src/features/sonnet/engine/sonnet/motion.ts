import { clamp, clamp01, distanceSquared, lerp } from '../math'
import type { Vec2 } from '../math'
import { easeInOut, expoOut } from '../easing'
import type { Shot, ShotKind } from './types'

export interface MotionFrame {
  x: number
  y: number
  scale: number
  rotation: number
}

export function segmentProgress(start: number, settle: number, time: number): number {
  return expoOut(clamp01((time - start) / Math.max(settle - start, 0.08)))
}

export function shotProgress(shot: Shot, time: number): number {
  return clamp01((time - shot.startTime) / Math.max(shot.endTime - shot.startTime, 0.001))
}

export function shotPathProgress(kind: ShotKind, progress: number): number {
  const linear = clamp01(progress)
  if (kind === 'ribbon' || kind === 'collage' || kind === 'quiet' || kind === 'poster')
    return linear * 0.55 + easeInOut(linear) * 0.45
  if (linear < 0.18) return expoOut(linear / 0.18) * 0.22
  if (linear < 0.78) return 0.22 + ((linear - 0.18) / 0.6) * 0.56
  const settle = (linear - 0.78) / 0.22
  return 0.78 + (1 - (1 - settle) * (1 - settle)) * 0.22
}

export function shotFrame(kind: ShotKind, progress: number): MotionFrame {
  const linear = clamp01(progress)
  const eased = shotPathProgress(kind, linear)
  switch (kind) {
    case 'editorial':
      return { x: -0.055 + eased * 0.095, y: 0.025 - eased * 0.04, scale: 0.98 + eased * 0.07, rotation: -0.006 + eased * 0.01 }
    case 'impact':
      return {
        x: -0.035 + eased * 0.07,
        y: 0.018 - eased * 0.028,
        scale: 1 + (1 - expoOut(Math.min(linear / 0.18, 1))) * 0.22 + eased * 0.08,
        rotation: -0.01 + eased * 0.016,
      }
    case 'collage':
      return { x: -0.045 + eased * 0.085, y: 0.028 - Math.sin(eased * Math.PI) * 0.055, scale: 0.97 + eased * 0.09, rotation: -0.014 + eased * 0.028 }
    case 'ribbon':
      return { x: -0.16 + eased * 0.28, y: 0.05 - eased * 0.085, scale: 0.98 + eased * 0.07, rotation: 0.008 - eased * 0.014 }
    case 'mask':
      return { x: 0.035 - eased * 0.065, y: 0.1 - eased * 0.135, scale: 0.96 + eased * 0.12, rotation: -0.006 + eased * 0.009 }
    case 'poster':
      return { x: -0.012 + eased * 0.024, y: 0.008 - eased * 0.016, scale: 0.99 + eased * 0.025, rotation: -0.0015 + eased * 0.003 }
    default:
      return { x: -0.022 + eased * 0.04, y: 0.014 - eased * 0.025, scale: 1 + eased * 0.028, rotation: -0.002 + eased * 0.003 }
  }
}

export function cameraBreath(time: number, phase = 0): MotionFrame {
  const tau = time * Math.PI * 2
  return {
    x: (Math.sin(tau * 0.13 + phase) * 0.65 + Math.sin(tau * 0.31 + phase * 1.7) * 0.35) * 0.006,
    y: (Math.cos(tau * 0.11 + phase * 2.3) * 0.65 + Math.sin(tau * 0.29 + phase * 0.9) * 0.35) * 0.006,
    scale: Math.sin(tau * 0.09 + phase * 1.3) * 0.002,
    rotation: Math.sin(tau * 0.07 + phase * 2.9) * 0.0015,
  }
}

export function breathWeight(time: number, revealDoneTime: number, rampDuration = 1.2): number {
  if (rampDuration <= 0) return time >= revealDoneTime ? 1 : 0
  return easeInOut(clamp01((time - revealDoneTime) / rampDuration))
}

export function fillFocusWeights(ranges: Array<{ start: number; end: number }>, time: number, sigma = 0.35): number[] {
  const safeSigma = Math.max(0.001, sigma)
  const logs: number[] = []
  let max = Number.NEGATIVE_INFINITY
  for (const range of ranges) {
    const start = Math.min(range.start, range.end)
    const end = Math.max(range.start, range.end)
    const distance = time < start ? start - time : time > end ? time - end : 0
    const log = -(distance * distance) / (2 * safeSigma * safeSigma)
    logs.push(log)
    if (log > max) max = log
  }
  const weights = logs.map((log) => Math.exp(log - max))
  const total = weights.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return weights
  return weights.map((value) => value / total)
}

export function segmentCameraFocus(
  glyphs: Array<{ position: Vec2; startTime: number }>,
  time: number,
  trackingFactor = 0.5,
): Vec2 {
  if (glyphs.length === 0) return { x: 0, y: 0 }
  const first = glyphs[0]
  const last = glyphs[glyphs.length - 1]
  const center = { x: (first.position.x + last.position.x) / 2, y: (first.position.y + last.position.y) / 2 }
  const apply = (exact: Vec2) => ({
    x: lerp(center.x, exact.x, trackingFactor),
    y: lerp(center.y, exact.y, trackingFactor),
  })
  if (time <= first.startTime) return apply(first.position)
  if (time >= last.startTime) return apply(last.position)
  for (let index = 0; index < glyphs.length - 1; index++) {
    const current = glyphs[index]
    const next = glyphs[index + 1]
    if (time < current.startTime || time > next.startTime) continue
    const progress = (time - current.startTime) / Math.max(0.001, next.startTime - current.startTime)
    return apply({ x: lerp(current.position.x, next.position.x, progress), y: lerp(current.position.y, next.position.y, progress) })
  }
  return apply(first.position)
}

export function sampleTrackingFocus(
  segments: Array<{ glyphs: Array<{ position: Vec2; startTime: number }>; start: number; end: number }>,
  time: number,
): Vec2 {
  if (segments.length === 0) return { x: 0, y: 0 }
  const weights = fillFocusWeights(segments.map((segment) => ({ start: segment.start, end: segment.end })), time)
  let x = 0
  let y = 0
  for (let index = 0; index < segments.length; index++) {
    const focus = segmentCameraFocus(segments[index].glyphs, time)
    x += focus.x * weights[index]
    y += focus.y * weights[index]
  }
  return { x, y }
}

const kernel: Array<{ offset: number; weight: number }> = [
  { offset: -1, weight: 1 },
  { offset: -0.5, weight: 4 },
  { offset: 0, weight: 6 },
  { offset: 0.5, weight: 4 },
  { offset: 1, weight: 1 },
]

export function smoothedTrackingFocus(
  segments: Array<{ glyphs: Array<{ position: Vec2; startTime: number }>; start: number; end: number }>,
  time: number,
  startTime: number,
  endTime: number,
  smoothingWindow = 0.12,
  maxBlendDistance = 96,
): Vec2 {
  const safeStart = Math.min(startTime, endTime)
  const safeEnd = Math.max(startTime, endTime)
  if (smoothingWindow <= 0 || safeStart === safeEnd) return sampleTrackingFocus(segments, clamp(time, safeStart, safeEnd))
  const samples = kernel.map(({ offset }) =>
    sampleTrackingFocus(segments, clamp(time + offset * smoothingWindow, safeStart, safeEnd)),
  )
  const center = samples[2]
  const maxDistanceSquared = maxBlendDistance * maxBlendDistance
  let total = 0
  let x = 0
  let y = 0
  for (let index = 0; index < samples.length; index++) {
    if (distanceSquared(samples[index], center) > maxDistanceSquared) continue
    x += samples[index].x * kernel[index].weight
    y += samples[index].y * kernel[index].weight
    total += kernel[index].weight
  }
  return total > 0 ? { x: x / total, y: y / total } : center
}

export function segmentNormalOffset(
  role: string,
  vertical: boolean,
  rotation: number,
  fontSize: number,
  randomValue: number,
): Vec2 {
  if (role !== 'support') return { x: 0, y: 0 }
  const distance = (clamp01(randomValue) * 2 - 1) * fontSize * 0.3
  const angle = rotation + (vertical ? 0 : Math.PI / 2)
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}

export function segmentDepth(role: string, random: () => number): number {
  if (role !== 'decoration') return 0
  return random() > 0.5 ? 0.5 + random() * 0.8 : -0.5 - random() * 0.8
}

export function animationScale(intensity: 'calm' | 'normal' | 'chaotic'): number {
  return intensity === 'calm' ? 0.65 : intensity === 'chaotic' ? 1.35 : 1
}
