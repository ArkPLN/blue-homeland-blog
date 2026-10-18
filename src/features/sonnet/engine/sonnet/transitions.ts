import { clamp01 } from '../math'
import { easeInOut } from '../easing'
import type { Paragraph, Shot, TransitionKind } from './types'

export interface TransitionFrame {
  alpha: number
  blur: number
  glitch: number
  glitchSeed: number
  scale: number
}

export const idleTransition: TransitionFrame = { alpha: 1, blur: 0, glitch: 0, glitchSeed: 0, scale: 1 }

export function resolveParagraph(
  paragraph: Paragraph,
  time: number,
  enabled: boolean,
  seed: number,
  allowGlitch: boolean,
): TransitionFrame {
  const transition = paragraph.transitionOut
  if (!enabled || !transition || time < transition.startTime) return idleTransition
  return resolve(transition.kind, false, (time - transition.startTime) / Math.max(0.001, transition.endTime - transition.startTime), seed, allowGlitch)
}

export function resolveEnter(
  kind: TransitionKind | null,
  timeSinceStart: number,
  duration: number,
  enabled: boolean,
  seed: number,
  allowGlitch: boolean,
): TransitionFrame {
  if (!enabled || !kind || timeSinceStart < 0 || timeSinceStart > duration) return idleTransition
  return resolve(kind, true, timeSinceStart / Math.max(0.001, duration), seed, allowGlitch)
}

function boundaryKind(seed: number, index: number): TransitionKind {
  const kinds: TransitionKind[] = ['fast-blur', 'mono-glitch', 'camera-pull']
  return kinds[((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0) % 3]
}

export function resolveShot(
  shots: Shot[],
  active: number,
  time: number,
  enabled: boolean,
  seed: number,
  allowGlitch: boolean,
): TransitionFrame {
  if (!enabled || shots.length < 2 || active < 0 || active >= shots.length) return idleTransition
  const current = shots[active]
  if (active > 0) {
    const duration = Math.min(0.24, Math.max(0.14, (current.startTime - shots[active - 1].startTime) * 0.18))
    if (time <= current.startTime + duration)
      return resolve(boundaryKind(seed, active - 1), true, (time - current.startTime) / duration, (seed + active * 97) >>> 0, allowGlitch)
  }
  if (active + 1 >= shots.length) return idleTransition
  const next = shots[active + 1]
  const exitDuration = Math.min(0.24, Math.max(0.14, (next.startTime - current.startTime) * 0.18))
  if (time < next.startTime - exitDuration) return idleTransition
  return resolve(
    boundaryKind(seed, active),
    false,
    (time - (next.startTime - exitDuration)) / exitDuration,
    (seed + (active + 1) * 97) >>> 0,
    allowGlitch,
  )
}

export function resolve(kind: TransitionKind, entering: boolean, progress: number, seed: number, allowGlitch: boolean): TransitionFrame {
  const actualKind = !allowGlitch && kind === 'mono-glitch' ? 'fast-blur' : kind
  const linear = clamp01(progress)
  const eased = easeInOut(linear)
  const amount = entering ? 1 - eased : eased
  if (actualKind === 'fast-blur') {
    return { alpha: entering ? 1 - amount * 0.82 : 1 - amount, blur: amount * 14, glitch: 0, glitchSeed: 0, scale: 1 }
  }
  if (actualKind === 'mono-glitch') {
    return {
      alpha: !entering && linear > 0.86 ? 1 - (linear - 0.86) / 0.14 : 1,
      blur: 0,
      glitch: amount,
      glitchSeed: seed * 0.0001 + Math.floor(linear * 14) * 0.173,
      scale: 1,
    }
  }
  return { alpha: entering ? 1 - amount * 0.72 : 1 - amount, blur: 0, glitch: 0, glitchSeed: 0, scale: 1 }
}
