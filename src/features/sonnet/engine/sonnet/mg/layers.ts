import { clamp, clamp01, positiveModulo } from '../../math'
import { mixSeed } from '../../random'
import { Container, SolidItem } from '../../scene-graph'
import type { AudioFrame, ParagraphKind, Shot, Theme, Tuning } from '../types'
import type { SolidPrimitive } from '../../gl/types'
import { withAlpha } from '../../gl/types'
import { buildFixedGeometry, buildHud, buildMainGeometry, mainGeometryName } from './geometry'
import { circle, ellipsePoints, line, seeded, starPoints, withOpacity } from './draw-helpers'

const golden = 0.6180339887

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3)
}

function trimStroke(points: Array<{ x: number; y: number }>, amount: number, closed: boolean): Array<{ x: number; y: number }> {
  if (amount >= 1) return points
  if (amount <= 0 || points.length < 2) return []
  const source = closed ? [...points, points[0]] : points
  let total = 0
  const lengths: number[] = []
  for (let index = 0; index < source.length - 1; index++) {
    const length = Math.hypot(source[index + 1].x - source[index].x, source[index + 1].y - source[index].y)
    lengths.push(length)
    total += length
  }
  let remaining = total * amount
  const output = [source[0]]
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= 0) break
    const segmentLength = lengths[index]
    const take = Math.min(1, remaining / Math.max(segmentLength, 0.0001))
    const from = source[index]
    const to = source[index + 1]
    output.push({ x: from.x + (to.x - from.x) * take, y: from.y + (to.y - from.y) * take })
    remaining -= segmentLength * take
  }
  return output
}

function revealPrimitives(primitives: SolidPrimitive[], progress: number, alphaFactor = 1): SolidPrimitive[] {
  const output: SolidPrimitive[] = []
  primitives.forEach((primitive, index) => {
    const delay = ((index * golden) % 1) * 0.5
    const span = Math.min(0.32 + ((index * 0.37) % 1) * 0.26, 1 - delay)
    const local = clamp01((progress - delay) / Math.max(0.001, span))
    if (local <= 0) return
    const eased = easeOutCubic(local)
    if (primitive.kind === 'stroke') {
      const points = trimStroke(primitive.points, eased, !!primitive.closed)
      if (points.length < 2) return
      output.push({ ...primitive, points, color: withOpacity(primitive.color, eased * alphaFactor) })
    } else if (primitive.kind === 'poly') {
      output.push({ ...primitive, color: withOpacity(primitive.color, eased * alphaFactor) })
    } else {
      output.push({ ...primitive, color: withOpacity(primitive.color, eased * alphaFactor) })
    }
  })
  return output
}

interface ParticleData {
  x: number
  y: number
  size: number
  shape: number
  color: ReturnType<typeof withOpacity>
  rotation: number
  alpha: number
}

function buildParticleData(layout: number, count: number, width: number, height: number, seed: number, theme: Theme): ParticleData[] {
  const random = seeded(seed)
  const hw = width / 2
  const hh = height / 2
  const particles: ParticleData[] = []
  for (let index = 0; index < count; index++) {
    const size = 4 + ((seed + index) % 12)
    const shape = positiveModulo(seed + index, 10)
    const color = withOpacity(index % 2 === 0 ? theme.primary : theme.secondary, 0.55 + random() * 0.3)
    let x = 0
    let y = 0
    let rotation = 0
    if (layout === 0) {
      x = -hw + width * random()
      y = -hh + height * random()
    } else if (layout === 1) {
      const ring = index % 2
      const radius = Math.min(hw, hh) * (0.36 + ring * 0.26)
      const angle = (index / count) * Math.PI * 2 + (seed % 17) * 0.04
      x = Math.cos(angle) * radius
      y = Math.sin(angle) * radius * 0.86
      rotation = angle + Math.PI / 2
    } else if (layout === 2) {
      const step = Math.floor(index / 2) + 0.5
      x = -hw * 0.88 + (step / Math.max(1, count / 2)) * hw * 1.76
      y = (index % 2 === 0 ? -1 : 1) * hh * 0.78
      rotation = index % 2 === 0 ? 0 : Math.PI
    } else if (layout === 3) {
      const corner = index % 4
      x = (corner === 0 || corner === 3 ? -1 : 1) * hw * 0.68 + (random() - 0.5) * width * 0.12
      y = (corner < 2 ? -1 : 1) * hh * 0.62 + (random() - 0.5) * height * 0.12
    } else if (layout === 4) {
      const column = index % 6
      const row = Math.floor(index / 6)
      x = -hw * 0.8 + (column / 5) * hw * 1.6 + (random() - 0.5) * width * 0.06
      y = -hh * 0.72 + (row / 3) * hh * 1.44 + (random() - 0.5) * height * 0.06
    } else {
      x = (index % 2 === 0 ? -1 : 1) * hw * 0.74
      y = -hh * 0.8 + (index / Math.max(1, count - 1)) * hh * 1.6
      rotation = index % 2 === 0 ? Math.PI : 0
    }
    particles.push({ x, y, size, shape, color, rotation, alpha: 0.72 + random() * 0.24 })
  }
  return particles
}

function shapePrimitives(particle: ParticleData, timeAlpha: number): SolidPrimitive[] {
  const s = particle.size
  const color = withOpacity(particle.color, particle.color.a * particle.alpha * timeAlpha)
  switch (particle.shape) {
    case 0:
      return [{ kind: 'poly', points: [{ x: -s / 2, y: -s / 2 }, { x: s / 2, y: -s / 2 }, { x: s / 2, y: s / 2 }, { x: -s / 2, y: s / 2 }], color }]
    case 1:
      return [{ kind: 'poly', points: [{ x: 0, y: -s / 2 }, { x: s / 2, y: 0 }, { x: 0, y: s / 2 }, { x: -s / 2, y: 0 }], color }]
    case 2:
      return [{ kind: 'stroke', points: starPoints(0, 0, s / 2, s / 5, 4), width: 1, color, closed: true }]
    case 3:
      return [circle(0, 0, s / 2, color)]
    case 4:
      return [{ kind: 'stroke', points: Array.from({ length: 7 }, (_, index) => ({ x: Math.cos((index / 6) * Math.PI * 2) * s * 0.5, y: Math.sin((index / 6) * Math.PI * 2) * s * 0.5 })), width: 1, color, closed: true }]
    case 5:
      return [circle(0, 0, Math.max(1.2, s * 0.18), color, { fill: true, segments: 10 })]
    case 6:
      return [line(-s * 0.5, 0, s * 0.5, 0, Math.max(1, s * 0.18), color)]
    case 7:
      return [line(-s * 0.4, 0, s * 0.4, 0, 1, color), line(0, -s * 0.4, 0, s * 0.4, 1, color)]
    case 8:
      return [{ kind: 'poly', points: [{ x: 0, y: -s / 2 }, { x: s / 2, y: s / 2 }, { x: -s / 2, y: s / 2 }], color }]
    default:
      return [{ kind: 'stroke', points: [{ x: -s / 2, y: -s / 4 }, { x: 0, y: s / 4 }, { x: s / 2, y: -s / 4 }], width: 1.2, color }]
  }
}

function flowerPrimitives(x: number, y: number, size: number, color: ReturnType<typeof withOpacity>, alpha: number): SolidPrimitive[] {
  const output: SolidPrimitive[] = []
  const petals = 6
  for (let index = 0; index < petals; index++) {
    const angle = (index / petals) * Math.PI * 2
    const cx = x + Math.cos(angle) * size * 0.34
    const cy = y + Math.sin(angle) * size * 0.34
    const petal = ellipsePoints(cx, cy, size * 0.22, size * 0.34, 20).map((point) => {
      const dx = point.x - cx
      const dy = point.y - cy
      return { x: cx + dx * Math.cos(angle) - dy * Math.sin(angle), y: cy + dx * Math.sin(angle) + dy * Math.cos(angle) }
    })
    output.push({ kind: 'stroke', points: petal, width: 1, color: withOpacity(color, alpha), closed: true })
  }
  output.push(circle(x, y, size * 0.12, withOpacity(color, Math.min(1, alpha + 0.18)), { fill: true, segments: 10 }))
  return output
}

export class MgView extends Container {
  readonly activeMainVariant: number
  readonly activeHudVariant: number
  readonly activeFixedVariant: number
  audio: AudioFrame = { power: 0, bass: 0, vocal: 0 }
  private readonly shot: Shot
  private readonly width: number
  private readonly height: number
  private readonly seed: number
  private readonly theme: Theme
  private readonly tuning: Tuning
  private readonly hud: SolidPrimitive[]
  private readonly main: SolidPrimitive[]
  private readonly fixed: SolidPrimitive[]
  private readonly particles: ParticleData[]
  private readonly particleCount: number
  private readonly hudItem = new SolidItem()
  private readonly mainRoot = new Container()
  private readonly mainItem = new SolidItem()
  private readonly fixedRoot = new Container()
  private readonly fixedItem = new SolidItem()
  private readonly particleRoot = new Container()
  private readonly particleItem = new SolidItem()
  private readonly flowerItem = new SolidItem()
  private cameraOffset = { x: 0, y: 0 }
  private frameScale = 1
  private cameraRotation = 0

  constructor(shot: Shot, paragraphKind: ParagraphKind, width: number, height: number, seed: number, theme: Theme, tuning: Tuning) {
    super()
    this.shot = shot
    this.width = width
    this.height = height
    this.seed = seed
    this.theme = theme
    this.tuning = tuning
    this.activeMainVariant = positiveModulo(seed, 100)
    this.activeHudVariant = mixSeed(seed, 0x9e3779b9) % 8
    this.activeFixedVariant = mixSeed(seed, 0x85ebca6b) % 8
    const particleLayout = mixSeed(seed, 0xc2b2ae35) % 6
    const hasMain = shot.kind === 'impact' || shot.kind === 'collage'
    this.hud = tuning.showBackgroundMg ? buildHud(this.activeHudVariant, { width, height, seed, theme }) : []
    this.main = hasMain && tuning.showBackgroundMg
      ? buildMainGeometry(this.activeMainVariant, { width, height, seed, theme })
      : []
    this.fixed = hasMain && tuning.showFixedGeometry
      ? buildFixedGeometry(this.activeFixedVariant, { width, height, seed, theme })
      : []
    this.particleCount = shot.kind === 'impact' ? 24 : 12
    this.particles = tuning.showBackgroundDecor
      ? buildParticleData(particleLayout, this.particleCount, width, height, seed, theme)
      : []

    this.hudItem.blend = 'alpha'
    this.mainItem.blend = 'screen'
    this.fixedItem.blend = 'alpha'
    this.particleItem.blend = 'screen'
    this.flowerItem.blend = 'screen'

    this.mainRoot.rotation = this.resolveMainRotation()
    this.mainRoot.add(this.mainItem)
    this.fixedRoot.add(this.fixedItem)
    this.particleRoot.add(this.particleItem, this.flowerItem)
    this.add(this.hudItem, this.mainRoot, this.fixedRoot, this.particleRoot)
    this.onUpdate = (time) => this.updateLayers(time)
    if (paragraphKind === 'break') this.mainRoot.rotation += 0.02
  }

  setCamera(offset: { x: number; y: number }, frameScale: number, rotation: number): void {
    this.cameraOffset = offset
    this.frameScale = frameScale
    this.cameraRotation = rotation
  }

  private resolveMainRotation(): number {
    const upright = new Set([6, 8, 9, 14, 15, 16, 17, 20, 22, 23])
    if (upright.has(this.activeMainVariant) || this.activeMainVariant >= 24) return 0
    return ((this.seed * 13) % 360) * (Math.PI / 180)
  }

  private updateLayers(time: number): void {
    const duration = Math.max(1, (this.shot.endTime - this.shot.startTime) * 0.95)
    const progress = clamp01((time - this.shot.startTime) / duration)
    this.hudItem.primitives = revealPrimitives(this.hud, progress)
    this.mainItem.primitives = revealPrimitives(this.main, progress)
    this.fixedItem.primitives = revealPrimitives(this.fixed, progress)
    this.fixedRoot.rotation = -this.cameraRotation
    this.particleRoot.x = this.cameraOffset.x * 0.4
    this.particleRoot.y = this.cameraOffset.y * 0.4
    this.particleRoot.rotation = (time - this.shot.startTime) * 0.05
    this.particleRoot.scaleX = 1 + (this.frameScale - 1) * 0.3
    this.particleRoot.scaleY = this.particleRoot.scaleX
    const particlePrimitives: SolidPrimitive[] = []
    const flowers: SolidPrimitive[] = []
    const energy = clamp01(0.34 * this.audio.bass + 0.52 * this.audio.vocal + 0.14 * this.audio.power)
    const gated = Math.max(0, (energy - 0.08) / 0.92)
    const audio = Math.min(1, Math.pow(gated, 0.68) * 1.35)
    this.particles.forEach((particle, index) => {
      particlePrimitives.push(...shapePrimitives(particle, 1))
      if (index % 4 === 0) {
        const entryDelay = ((index * 0.19) % 1) * 0.7
        const entry = clamp01((progress - entryDelay) / 0.3)
        const pulse = 0.5 + 0.5 * Math.sin((time - this.shot.startTime) * Math.PI * 0.7 + (index % 31) * 0.2)
        const alpha = 0.85 * easeOutCubic(entry) * (0.72 + audio * 0.38 + pulse * 0.03)
        const scale = (0.72 + easeOutCubic(entry) * 0.28) * (1 + audio * 0.42) * (1 + pulse * 0.025)
        flowers.push(...flowerPrimitives(particle.x, particle.y, particle.size * 3.4 * scale, particle.color, alpha))
      }
    })
    this.particleItem.primitives = particlePrimitives
    this.flowerItem.primitives = flowers
  }

  get debugLabel(): string {
    return `H${this.activeHudVariant} F${this.activeFixedVariant} ${mainGeometryName(this.activeMainVariant)}`
  }
}
