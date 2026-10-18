import { clamp01, positiveModulo } from '../../math'
import { easeInOut, expoOut, elasticOut } from '../../easing'
import { hashString } from '../../random'
import { Container, SolidItem, TextItem } from '../../scene-graph'
import type { SolidPrimitive } from '../../gl/types'
import { withAlpha } from '../../gl/types'
import type { Shot, Theme } from '../types'
import type { GlyphPlacement, TypographyPlacement } from '../glyph-layout'
import { circle, line, stroke, withOpacity } from './draw-helpers'

const bezier = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, t: number) => {
  const inverse = 1 - t
  return {
    x: inverse * inverse * inverse * p0.x + 3 * inverse * inverse * t * p1.x + 3 * inverse * t * t * p2.x + t * t * t * p3.x,
    y: inverse * inverse * inverse * p0.y + 3 * inverse * inverse * t * p1.y + 3 * inverse * t * t * p2.y + t * t * t * p3.y,
  }
}

export class GuideView extends Container {
  private readonly item = new SolidItem()
  private readonly start: number
  private readonly end: number
  private readonly maxAlpha: number
  private readonly origin: { x: number; y: number }
  private readonly fontSize: number
  private readonly hero: boolean
  private readonly theme: Theme
  private readonly seed: number
  private readonly direction: number

  constructor(placement: TypographyPlacement, segmentStart: number, segmentEnd: number, theme: Theme, seed: number) {
    super()
    this.x = placement.x
    this.y = placement.y
    this.fontSize = placement.fontSize
    this.hero = placement.role === 'hero'
    this.maxAlpha = this.hero ? 0.95 : 0.7
    this.theme = theme
    this.seed = seed
    const cueLead = Math.min(0.38, Math.max(0.2, 0.18 + (segmentEnd - segmentStart) * 0.1))
    this.start = segmentStart - cueLead
    this.end = segmentStart + 0.65
    this.direction = seed % 2 === 0 ? -1 : 1
    const enterX = placement.enterX !== 0 ? placement.enterX : this.direction * this.fontSize * 1.8
    const enterY = placement.enterY !== 0 ? placement.enterY : -this.fontSize * 0.9
    this.origin = { x: enterX, y: enterY }
    this.item.blend = 'screen'
    this.add(this.item)
    this.onUpdate = (time) => this.updateGuide(time)
  }

  private updateGuide(time: number): void {
    if (time < this.start || time > this.end) {
      this.visible = false
      return
    }
    this.visible = true
    const p = clamp01((time - this.start) / Math.max(0.001, this.end - this.start))
    const draw = clamp01(p / 0.35)
    const fade = 1 - clamp01((p - 0.4) / 0.3)
    const primitives: SolidPrimitive[] = []
    const p0 = this.origin
    const p1 = { x: p0.x * 0.6, y: p0.y * 0.4 }
    const p2 = { x: p0.x * 0.2, y: p0.y * 0.1 }
    const p3 = { x: 0, y: 0 }
    const count = 48
    const points = Array.from({ length: count + 1 }, (_, index) => bezier(p0, p1, p2, p3, (index / count) * draw))
    const color = withOpacity(this.hero ? this.theme.accent : this.theme.secondary, this.maxAlpha * fade)
    if (points.length > 1) primitives.push(stroke(points, this.hero ? 1.6 : 1.1, color))
    const head = points[points.length - 1] ?? p3
    primitives.push(circle(head.x, head.y, this.hero ? 14 : 9, withOpacity(this.theme.accent, 0.5 * fade), { fill: true, segments: 24 }))
    primitives.push(circle(head.x, head.y, this.hero ? 4.5 : 3, withOpacity(this.theme.primary, 0.95 * fade), { fill: true, segments: 12 }))
    if (this.hero || this.seed % 5 > 1) {
      for (const side of [-1, 1]) {
        const offset = side * this.fontSize * 0.42
        const ribbon = points.map((point) => ({ x: point.x + offset * 0.2, y: point.y + offset }))
        primitives.push(stroke(ribbon, 1, withOpacity(this.theme.primary, 0.16 * fade)))
      }
    }
    if (this.seed % 3 !== 0) {
      const a = this.seed * 0.7
      const length = this.fontSize * (1.2 + (this.seed % 7) * 0.2)
      primitives.push(line(
        head.x - Math.cos(a) * length / 2,
        head.y - Math.sin(a) * length / 2,
        head.x + Math.cos(a) * length / 2,
        head.y + Math.sin(a) * length / 2,
        this.hero ? 3 : 2,
        withOpacity(this.theme.primary, 0.28 * fade),
      ))
    }
    if (p > 0.3) {
      const burst = this.hero ? 6 : 3
      const q = clamp01((p - 0.3) / 0.7)
      const ease = 1 - Math.pow(1 - q, 3)
      for (let index = 0; index < burst; index++) {
        const angle = (index / burst) * Math.PI * 2 + this.seed * 0.1
        const speed = (this.hero ? 1 : 0.7) * (15 + ((this.seed + index * 37) % 45))
        const size = 3 + ((this.seed + index * 13) % 4)
        primitives.push(circle(
          head.x + Math.cos(angle) * speed * ease,
          head.y + Math.sin(angle) * speed * ease,
          size * (1 - q * 0.4),
          withOpacity(this.theme.accent, (1 - q) * 0.8),
          { fill: index % 2 === 0, width: 1, segments: 8 },
        ))
      }
    }
    this.item.primitives = primitives
  }
}

export class FrameDecorView extends Container {
  private readonly item = new SolidItem()
  private readonly start: number
  private readonly end: number
  private readonly variant: number
  private readonly halfWidth: number
  private readonly halfHeight: number
  private readonly gap: number
  private readonly lineWidth: number
  private readonly color: Theme['primary']

  constructor(placement: TypographyPlacement, firstGlyphStart: number, motionDuration: number, seed: number, theme: Theme) {
    super()
    this.x = placement.x
    this.y = placement.y
    const hash = hashString(`${placement.displayText}:${placement.segmentIndex}:frame-decor`)
    this.variant = (hash >> 10) % 4
    const pad = Math.min(20, Math.max(8, placement.fontSize * 0.22))
    const rotated = Math.abs(Math.sin(placement.rotation)) > 0.5
    this.halfWidth = (rotated ? placement.measuredHeight : placement.measuredWidth) / 2 + pad
    this.halfHeight = (rotated ? placement.measuredWidth : placement.measuredHeight) / 2 + pad
    this.gap = Math.min(30, Math.max(6, Math.min(this.halfWidth, this.halfHeight) * (this.variant === 1 ? 0.42 : 0.3)))
    this.lineWidth = Math.min(2.2, Math.max(1.2, placement.fontSize * 0.03))
    this.color = theme.primary
    this.start = firstGlyphStart
    this.end = firstGlyphStart + motionDuration * 1.25
    this.item.blend = 'alpha'
    this.add(this.item)
    this.onUpdate = (time) => this.updateFrame(time, hash)
  }

  private updateFrame(time: number, hash: number): void {
    const p = clamp01((time - this.start) / Math.max(0.001, this.end - this.start))
    if (p <= 0) {
      this.visible = false
      return
    }
    this.visible = true
    const eased = expoOut(p)
    const primitives: SolidPrimitive[] = []
    const color = withOpacity(this.color, 0.96)
    const sides = [
      { x1: -this.halfWidth, y1: -this.halfHeight, x2: this.halfWidth, y2: -this.halfHeight, length: this.halfWidth * 2 },
      { x1: this.halfWidth, y1: -this.halfHeight, x2: this.halfWidth, y2: this.halfHeight, length: this.halfHeight * 2 },
      { x1: this.halfWidth, y1: this.halfHeight, x2: -this.halfWidth, y2: this.halfHeight, length: this.halfWidth * 2 },
      { x1: -this.halfWidth, y1: this.halfHeight, x2: -this.halfWidth, y2: -this.halfHeight, length: this.halfHeight * 2 },
    ]
    sides.forEach((side, index) => {
      const local = clamp01((eased - index * 0.2) / 0.4)
      const startOffset = this.gap
      const length = Math.max(0, side.length - this.gap * 2)
      const growth = clamp01(local)
      if (growth <= 0) return
      const dx = side.x2 - side.x1
      const dy = side.y2 - side.y1
      const total = Math.hypot(dx, dy)
      const ux = dx / total
      const uy = dy / total
      const sx = side.x1 + ux * startOffset
      const sy = side.y1 + uy * startOffset
      const ex = sx + ux * length * growth
      const ey = sy + uy * length * growth
      if (this.variant === 3) {
        primitives.push({
          kind: 'stroke',
          points: [{ x: sx, y: sy }, { x: ex, y: ey }],
          width: this.lineWidth,
          color,
          dash: Math.min(8, Math.max(5, this.halfWidth * 0.12)),
          gap: Math.min(8, Math.max(5, this.halfWidth * 0.2)),
        })
      } else {
        primitives.push(line(sx, sy, ex, ey, this.lineWidth, color))
      }
    })
    for (let corner = 0; corner < 4; corner++) {
      const local = clamp01((eased - 0.35 - corner * 0.14) / 0.3)
      if (local <= 0) continue
      const growth = elasticOut(local)
      if (growth <= 0.02) continue
      const x = corner === 0 || corner === 3 ? -this.halfWidth : this.halfWidth
      const y = corner < 2 ? -this.halfHeight : this.halfHeight
      const arm = Math.min(12, Math.max(5, this.gap)) * growth
      if (this.variant === 0) {
        primitives.push(line(x, y, x + (corner === 0 || corner === 3 ? arm : -arm), y, 1, color))
        primitives.push(line(x, y, x, y + (corner < 2 ? arm : -arm), 1, color))
      } else if (this.variant === 1) {
        primitives.push(circle(x, y, 2.4 * growth, color, { fill: true, segments: 8 }))
      } else if (this.variant === 2) {
        primitives.push(line(x, y, x + (corner === 0 || corner === 3 ? arm : -arm), y, 1, color))
        primitives.push(line(x, y, x, y + (corner < 2 ? arm : -arm), 1, color))
        primitives.push(circle(x + (corner === 0 || corner === 3 ? arm : -arm), y + (corner < 2 ? arm : -arm), 2.2 * growth, color, { fill: true, segments: 8 }))
      } else {
        primitives.push(line(x, y, x + (corner === 0 || corner === 3 ? arm : -arm), y + (corner < 2 ? arm : -arm), 1, color))
      }
    }
    if (this.variant === 1) primitives.push(circle(0, 0, 1.8, withOpacity(this.color, 0.9), { fill: true, segments: 8 }))
    this.item.primitives = primitives
    this.item.alpha = 1
  }
}

const laFolia: Array<{ step: number; beats: number; sharp?: boolean }> = [
  { step: 0, beats: 1 }, { step: 2, beats: 1 }, { step: 4, beats: 1 }, { step: 5, beats: 1.5 }, { step: 4, beats: 0.5 },
  { step: 2, beats: 1 }, { step: 0, beats: 1 }, { step: -1, beats: 1 }, { step: 0, beats: 2 }, { step: 2, beats: 1 },
  { step: 4, beats: 1 }, { step: 6, beats: 1.5 }, { step: 5, beats: 0.5 }, { step: 4, beats: 1 }, { step: 2, beats: 1 },
  { step: 0, beats: 1 }, { step: 2, beats: 1 }, { step: 3, beats: 1 }, { step: 4, beats: 2 }, { step: 5, beats: 1 },
  { step: 6, beats: 1 }, { step: 4, beats: 1 }, { step: 2, beats: 1 }, { step: 0, beats: 2 },
]

export class StaffView extends Container {
  private readonly item = new SolidItem()
  private readonly shotStart: number
  private readonly staffWidth: number
  private readonly spacing: number
  private readonly beatWidth: number
  private readonly totalBeats = laFolia.reduce((sum, note) => sum + note.beats, 0)
  private readonly theme: Theme

  constructor(placement: TypographyPlacement, baseFontSize: number, shotStart: number, width: number, theme: Theme) {
    super()
    this.x = placement.x
    this.y = placement.y
    this.shotStart = shotStart
    this.theme = theme
    this.staffWidth = Math.max(300, width * 0.6)
    this.spacing = baseFontSize * 0.25
    this.beatWidth = (this.staffWidth * 0.92) / 24
    this.item.blend = 'screen'
    this.add(this.item)
    this.onUpdate = (time) => this.updateStaff(time)
  }

  private updateStaff(time: number): void {
    const primitives: SolidPrimitive[] = []
    const halfWidth = this.staffWidth / 2
    const halfHeight = this.spacing * 2
    const lineColor = withOpacity(this.theme.primary, 0.3)
    for (let index = 0; index < 5; index++)
      primitives.push(line(-halfWidth, -halfHeight + index * this.spacing, halfWidth, -halfHeight + index * this.spacing, 2, lineColor))
    for (let index = 0; index < 7; index++)
      primitives.push(line(-halfWidth + (index + 1) * (this.staffWidth / 8), -halfHeight, -halfWidth + (index + 1) * (this.staffWidth / 8), halfHeight, 1, withOpacity(this.theme.secondary, 0.16)))
    primitives.push(line(-halfWidth, -halfHeight, -halfWidth, halfHeight, 4, withOpacity(this.theme.primary, 0.5)))
    primitives.push(line(halfWidth, -halfHeight, halfWidth, halfHeight, 2, withOpacity(this.theme.primary, 0.5)))
    primitives.push(line(halfWidth + 6, -halfHeight, halfWidth + 6, halfHeight, 1, withOpacity(this.theme.primary, 0.5)))
    const cycle = ((time - this.shotStart) % 8 + 8) % 8
    const beat = (cycle / 8) * this.totalBeats
    const noteScale = 24 / this.totalBeats
    let noteBeat = 0
    laFolia.forEach((note, index) => {
      const x = -halfWidth * 0.92 + noteBeat * noteScale * this.beatWidth + this.beatWidth / 2
      const y = halfHeight - note.step * this.spacing * 0.5
      const active = beat >= noteBeat && beat < noteBeat + Math.max(0.5, note.beats)
      const pulse = 0.5 + 0.5 * Math.sin(cycle * Math.PI * 5 + index * 0.4)
      const alpha = active ? 0.78 + pulse * 0.16 : 0.28 + (index % 3) * 0.03
      const scale = active ? 1 + pulse * 0.12 : 1
      const color = withOpacity(this.theme.primary, alpha)
      primitives.push(circle(x, y, 4.8 * scale, withOpacity(this.theme.accent, alpha), { fill: true, segments: 12 }))
      const stemDirection = note.step >= 6 ? -1 : 1
      primitives.push(line(x + 4 * scale, y, x + 4 * scale, y - stemDirection * 3.1 * this.spacing, 1, withOpacity(this.theme.primary, Math.min(0.9, alpha + 0.08))))
      if (note.beats <= 0.5) primitives.push(line(x + 4 * scale, y - stemDirection * 3.1 * this.spacing, x + 1.5 * scale, y - stemDirection * 3.1 * this.spacing + 5, 1, color))
      if (note.sharp) for (let sharp = 0; sharp < 4; sharp++) primitives.push(line(x - 8 + sharp * 2, y - 6, x - 5 + sharp * 2, y + 6, 1, withOpacity(this.theme.primary, Math.min(0.86, alpha + 0.08))))
      noteBeat += note.beats
    })
    const cursorX = -halfWidth * 0.92 + beat * noteScale * this.beatWidth
    primitives.push(line(cursorX, -halfHeight - this.spacing * 1.6, cursorX, halfHeight + this.spacing * 1.6, 1.5, withOpacity(this.theme.accent, 0.34)))
    this.item.primitives = primitives
  }
}

export interface CreditsMetadata {
  title?: string
  artist?: string
  album?: string
}

export class CreditsView extends Container {
  lyricAlphaValue = 1
  lyricBlurValue = 0
  private readonly finalEnd: number
  private readonly width: number
  private readonly height: number
  private readonly theme: Theme
  private readonly items: TextItem[] = []

  constructor(width: number, height: number, finalEnd: number, metadata: CreditsMetadata, theme: Theme) {
    super()
    this.width = width
    this.height = height
    this.finalEnd = finalEnd
    this.theme = theme
    this.visible = false
    this.x = width / 2
    this.y = height / 2
    const left = Math.max(38, width * 0.105)
    const right = Math.max(38, width * 0.09)
    const contentWidth = Math.max(220, width - left - right)
    const titleSize = Math.min(118, Math.max(42, width * 0.088))
    const detailSize = Math.min(25, Math.max(13, width * 0.018))
    const accent = new SolidItem()
    accent.blend = 'alpha'
    accent.primitives = [
      { kind: 'poly', points: [{ x: -width / 2 + left, y: -height / 2 + height * 0.155 }, { x: -width / 2 + left + Math.max(42, width * 0.075), y: -height / 2 + height * 0.155 }, { x: -width / 2 + left + Math.max(42, width * 0.075), y: -height / 2 + height * 0.155 + 5 }, { x: -width / 2 + left, y: -height / 2 + height * 0.155 + 5 }], color: withOpacity(theme.accent, 0.95) },
      line(-width / 2 + left, -height / 2 + height * 0.155, -width / 2 + left, -height / 2 + height * 0.725, 2, withOpacity(theme.primary, 0.22)),
      line(-width / 2 + left, -height / 2 + height * 0.79, width / 2 - right, -height / 2 + height * 0.79, 1, withOpacity(theme.secondary, 0.36)),
    ]
    this.add(accent)
    if (metadata.artist) {
      const item = new TextItem({ text: metadata.artist.toUpperCase(), fontSize: detailSize, weight: 400, color: withOpacity(theme.accent, 0.9) })
      item.anchorX = 0
      item.anchorY = 0
      item.x = -width / 2 + left + 20
      item.y = -height / 2 + height * 0.205
      this.add(item)
      this.items.push(item)
    }
    if (metadata.title) {
      const item = new TextItem({ text: metadata.title, fontSize: titleSize, weight: 700, color: theme.primary })
      item.anchorX = 0
      item.anchorY = 0
      item.x = -width / 2 + left + 16
      item.y = -height / 2 + height * 0.285
      this.add(item)
      this.items.push(item)
    }
    if (metadata.album) {
      const item = new TextItem({ text: `— ${metadata.album}`, fontSize: detailSize * 0.92, weight: 400, color: withOpacity(theme.secondary, 0.9) })
      item.anchorX = 0
      item.anchorY = 0
      item.x = -width / 2 + left + 18
      item.y = -height / 2 + height * 0.825
      this.add(item)
      this.items.push(item)
    }
    this.onUpdate = (time) => this.updateCredits(time)
  }

  private updateCredits(time: number): void {
    const elapsed = time - this.finalEnd
    if (elapsed <= 0) {
      this.visible = false
      this.lyricAlphaValue = 1
      this.lyricBlurValue = 0
      return
    }
    this.visible = true
    const lyricExit = easeInOut(clamp01(elapsed / 1.25))
    const posterEnter = easeInOut(clamp01((elapsed - 0.38) / 1.55))
    this.lyricAlphaValue = 1 - lyricExit
    this.lyricBlurValue = lyricExit * 18
    this.alpha = posterEnter
    this.y = this.height / 2 + (1 - posterEnter) * 0.04 * this.height
    const scale = 0.965 + posterEnter * 0.035
    this.scaleX = scale
    this.scaleY = scale
    this.items.forEach((item) => { item.alpha = 1 })
  }
}

export function buildBackdrop(width: number, height: number, seed: number, theme: Theme): Container {
  const root = new Container()
  const base = new SolidItem()
  base.blend = 'alpha'
  const primitives: SolidPrimitive[] = [
    { kind: 'poly', points: [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }], color: withOpacity(theme.background, 0.16) },
  ]
  for (let index = 0; index < 9; index++) {
    const x = (((seed + index * 97) % 997) / 997) * width
    const y = (((seed + index * 193) % 991) / 991) * height
    const length = 32 + ((seed + index * 43) % 180)
    primitives.push(line(x, y, Math.min(width, x + length), y, index % 3 === 0 ? 2 : 1, withOpacity(index % 2 === 0 ? theme.accent : theme.secondary, 0.12 + (index % 4) * 0.04)))
  }
  base.primitives = primitives
  root.add(base)
  const label = new TextItem({ text: 'MIDNIGHT DREAM  /  SONNET', fontSize: 11, weight: 400, color: withOpacity(theme.accent, 0.3) })
  label.anchorX = 0
  label.anchorY = 0
  label.x = width * 0.05
  label.y = height * 0.5
  label.rotation = -Math.PI / 2
  root.add(label)
  const note = new TextItem({ text: 'A LYRIC STUDY IN MOTION', fontSize: 9, weight: 400, color: withOpacity(theme.secondary, 0.28) })
  note.anchorX = 1
  note.anchorY = 0
  note.x = width * 0.95
  note.y = height * 0.5
  note.rotation = -Math.PI / 2
  root.add(note)
  return root
}

export function buildOuterFrame(width: number, height: number, theme: Theme): SolidItem {
  const frame = new SolidItem()
  frame.blend = 'alpha'
  const px = Math.max(30, width * 0.05)
  const py = Math.max(30, height * 0.05)
  const color = withOpacity(theme.primary, 0.5)
  const strong = withOpacity(theme.primary, 0.8)
  frame.primitives = [
    line(px, py + 16, px, py + 120, 1, color),
    line(px, py, px + 30, py, 4, strong),
    line(width - px - 160, height - py, width - px - 20, height - py, 1, color),
    line(width - px, height - py - 180, width - px, height - py - 30, 1, color),
    line(width - px - 4, height - py - 16, width - px - 4, height - py, 4, strong),
    line(width - px - 6, py + 20, width - px + 6, py + 20, 1, strong),
    line(width - px, py + 14, width - px, py + 26, 1, strong),
    circle(px, height - py, 5, withOpacity(theme.accent, 0.7), { fill: true, segments: 10 }),
  ]
  return frame
}

export function textFixedGeometryState(seed: number, chorus: boolean): { applied: boolean; variant: number } {
  const legacy = seed % 4
  const applied = seed % 100 < (chorus ? 26 : 15)
  let variant = 0
  if (chorus) {
    const chorusSeed = seed % 10
    variant = chorusSeed < 9 ? positiveModulo(Math.floor(seed / 10) + chorusSeed, 4) : 4 + (Math.floor(seed / 10) % 3)
  } else {
    variant = legacy === 1 || legacy === 2 ? positiveModulo(Math.floor(seed / 4) + legacy, 4) : 4 + (Math.floor(seed / 4) % 3)
  }
  return { applied, variant: positiveModulo(variant, 7) }
}
