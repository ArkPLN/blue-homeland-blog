import { clamp01, lerp, lerpVec } from '../math'
import type { Vec2 } from '../math'
import { easeInOut } from '../easing'
import { DotNetRandom, hashString } from '../random'
import { Container, SolidItem, TextItem } from '../scene-graph'
import type { SceneDrawContext } from '../scene-graph'
import type { BlendMode, SolidPrimitive, TextStyle } from '../gl/types'
import type {
  AnimationIntensity,
  AudioFrame,
  CompiledLine,
  Paragraph,
  ParagraphKind,
  Program,
  SemanticSegment,
  Shot,
  ShotKind,
  Theme,
  Tuning,
} from './types'
import { findParagraphIndexAtTime } from './program-compiler'
import { buildGlyphs, resolveMotionDuration } from './glyph-layout'
import type { GlyphPlacement, TypographyPlacement } from './glyph-layout'
import { isEmphasis } from './roles'
import { measureGlyph, measureText } from './measure'
import {
  animationScale,
  breathWeight,
  cameraBreath,
  segmentDepth,
  segmentNormalOffset,
  segmentProgress,
  shotFrame,
  shotProgress,
  smoothedTrackingFocus,
} from './motion'
import { idleTransition, resolveEnter, resolveParagraph, resolveShot } from './transitions'
import type { TransitionFrame } from './transitions'
import { resolveTypography } from './typography-layout'
import { MgView } from './mg/layers'
import {
  CreditsView,
  FrameDecorView,
  GuideView,
  StaffView,
  buildBackdrop,
  buildOuterFrame,
  textFixedGeometryState,
} from './mg/overlays'
import { buildTextFixedGeometry } from './mg/geometry'
import { withOpacity } from './mg/draw-helpers'

const transitionIdle = (frame: TransitionFrame): boolean =>
  Math.abs(frame.alpha - 1) < 1e-6 && frame.blur === 0 && frame.glitch === 0

interface GhostRef {
  node: TextItem
  offset: Vec2
  alphaBase: number
}

interface GlyphRef {
  wrapper: Container
  caWrapper: Container | null
  cyan: TextItem | null
  red: TextItem | null
  core: TextItem
  ghosts: GhostRef[]
  placement: GlyphPlacement
  role: TypographyPlacement['role']
  finalRotation: number
  fontSize: number
  depth: number
  ghostDuration: number
  isBackgroundShape: boolean
}

interface TrackingGlyph {
  position: Vec2
  startTime: number
}

interface TrackingRef {
  glyphs: TrackingGlyph[]
  start: number
  end: number
}

interface FixedGeoRef {
  item: SolidItem
  placement: TypographyPlacement
  depth: number
}

interface ShotView {
  shot: Shot
  root: Container
  glyphs: GlyphRef[]
  frames: FrameDecorView[]
  fixedGeos: FixedGeoRef[]
  mg: MgView
  focus: Vec2
  basePosition: Vec2
  tracking: TrackingRef[]
  revealDoneTime: number
  staff: StaffView | null
  placements: TypographyPlacement[]
}

interface ParagraphView {
  paragraph: Paragraph
  root: Container
  shots: ShotView[]
  noiseSeed: number
  transitionSeed: number
}

export interface SonnetMetadata {
  title?: string
  artist?: string
  album?: string
}

export class SonnetScene {
  readonly program: Program
  readonly theme: Theme
  readonly tuning: Tuning
  readonly metadata: SonnetMetadata
  readonly stage = new Container()
  private readonly paragraphLayer = new Container()
  private readonly cache = new Map<number, ParagraphView>()
  private width = 1
  private height = 1
  private activeParagraph = -1
  private activeShot = 0
  private credits: CreditsView | null = null
  private audio: AudioFrame = { power: 0, bass: 0, vocal: 0 }
  blur = 0
  glitch = 0
  glitchSeed = 0
  debugParagraph = ''
  debugShot = ''
  debugMg = ''

  constructor(program: Program, theme: Theme, tuning: Tuning, metadata: SonnetMetadata, width: number, height: number) {
    this.program = program
    this.theme = theme
    this.tuning = tuning
    this.metadata = metadata
    this.buildStage(width, height)
  }

  resize(width: number, height: number): void {
    this.buildStage(width, height)
  }

  setAudio(audio: AudioFrame): void {
    this.audio = audio
  }

  update(time: number): void {
    if (this.program.paragraphs.length === 0 || this.width <= 0 || this.height <= 0) return
    const index = findParagraphIndexAtTime(this.program, time)
    this.credits?.update(time, 0)
    if (!this.cache.has(index)) this.buildParagraph(index)
    this.activeParagraph = index
    for (const [paragraphIndex, view] of this.cache) {
      view.root.visible = paragraphIndex === index
      if (paragraphIndex === index) this.updateParagraph(view, index, time)
    }
    for (const [paragraphIndex, view] of this.cache) {
      if (Math.abs(paragraphIndex - index) <= 1) continue
      this.paragraphLayer.remove(view.root)
      this.cache.delete(paragraphIndex)
    }
    if (index + 1 < this.program.paragraphs.length && !this.cache.has(index + 1)) this.buildParagraph(index + 1)
    else if (index - 1 >= 0 && !this.cache.has(index - 1)) this.buildParagraph(index - 1)
  }

  draw(ctx: SceneDrawContext): void {
    this.stage.draw(ctx)
  }

  private buildStage(width: number, height: number): void {
    this.width = Math.max(1, width)
    this.height = Math.max(1, height)
    this.stage.children.length = 0
    this.paragraphLayer.children.length = 0
    this.cache.clear()
    this.activeParagraph = -1
    const seed = hashString(`${this.program.seed}:stage`)
    this.stage.add(buildBackdrop(this.width, this.height, seed, this.theme))
    this.stage.add(this.paragraphLayer)
    const last = this.program.paragraphs[this.program.paragraphs.length - 1]
    this.credits = new CreditsView(this.width, this.height, last?.endTime ?? 0, this.metadata, this.theme)
    this.credits.visible = false
    this.stage.add(this.credits)
    this.stage.add(buildOuterFrame(this.width, this.height, this.theme))
  }

  private buildParagraph(index: number): void {
    const paragraph = this.program.paragraphs[index]
    if (!paragraph) return
    const root = new Container()
    const noiseSeed = hashString(`${this.program.seed}:${paragraph.id}`)
    const transitionSeed = hashString(`${this.program.seed}:${paragraph.id}:transition-frame`)
    const shots: ShotView[] = []
    for (let shotIndex = 0; shotIndex < paragraph.shots.length; shotIndex++) {
      const shot = paragraph.shots[shotIndex]
      const shotSeed = (noiseSeed + shotIndex * 97) >>> 0
      const view = this.buildShot(paragraph, shot, shotIndex, shotSeed)
      shots.push(view)
      root.add(view.root)
    }
    root.visible = false
    this.paragraphLayer.add(root)
    this.cache.set(index, { paragraph, root, shots, noiseSeed, transitionSeed })
  }

  private buildShot(paragraph: Paragraph, shot: Shot, shotIndex: number, shotSeed: number): ShotView {
    const root = new Container()
    const lines = paragraph.lines.filter((line) => shot.lineIndices.includes(line.sourceIndex))
    const lineSegments = lines.map((line) => line.segments)
    const flatSegments = lineSegments.flat()
    const lineOfSegment: number[] = []
    lineSegments.forEach((segments, lineIndex) => {
      segments.forEach(() => lineOfSegment.push(lineIndex))
    })
    const typography = resolveTypography(
      lineSegments,
      shot.kind,
      this.width,
      this.height,
      this.theme.fontWeight,
      shot.camera.zoom,
    )
    const placements = typography.placements
    const mg = new MgView(shot, paragraph.kind, this.width, this.height, shotSeed, this.theme, this.tuning)
    const guideLayer = new Container()
    const textLayer = new Container()
    const behindLayer = new Container()
    const caLayer = new Container()
    textLayer.add(behindLayer).add(caLayer)
    root.add(mg, guideLayer, textLayer)

    const glyphs: GlyphRef[] = []
    const frames: FrameDecorView[] = []
    const fixedGeos: FixedGeoRef[] = []
    const trackingByLine: TrackingGlyph[][] = lines.map(() => [])
    let staff: StaffView | null = null
    let heroFocus: Vec2 = { x: 0, y: 0 }
    let heroFound = false

    placements.forEach((originalPlacement, placementIndex) => {
      const segment = flatSegments[originalPlacement.segmentIndex]
      if (!segment) return
      let placement = originalPlacement
      const isDecoration = placement.role === 'decoration'
      if (placement.role === 'hero' && !heroFound) {
        heroFocus = { x: placement.x, y: placement.y }
        heroFound = true
      }
      const normalSeed = hashString(`${segment.text}:${segment.startOffset}:${segment.endOffset}:${placement.segmentIndex}:normal-offset`) >>> 0
      if (!isDecoration) {
        const normalOffset = segmentNormalOffset(placement.role, placement.vertical, placement.rotation, placement.fontSize, normalSeed / 4294967296)
        placement = { ...placement, x: placement.x + normalOffset.x, y: placement.y + normalOffset.y }
      }
      const depthRandom = new DotNetRandom(hashString(`${shot.id}:${placementIndex}:${segment.text}`) | 0)
      const depth = isDecoration ? segmentDepth('decoration', () => depthRandom.nextDouble()) : 0
      const glowColor = isEmphasis(placement.role) ? this.theme.primary : this.theme.accent
      if (isDecoration) {
        const wrapper = new Container()
        wrapper.alpha = 0
        const core = new TextItem({
          text: segment.text,
          fontSize: placement.fontSize,
          weight: this.theme.fontWeight,
          color: this.theme.accent,
          strokeWidth: Math.min(8, Math.max(1, placement.fontSize * 0.006)),
          fill: false,
          rasterScale: 0.8,
        })
        core.alpha = 0.2
        wrapper.add(core)
        textLayer.add(wrapper)
        const startTime = segment.startTime
        glyphs.push({
          wrapper,
          caWrapper: null,
          cyan: null,
          red: null,
          core,
          ghosts: [],
          placement: {
            text: segment.text,
            position: { x: placement.x, y: placement.y },
            entrance: { x: placement.enterX, y: placement.enterY },
            entryRotation: 0,
            startTime,
            settleTime: startTime + resolveMotionDuration(shot.startTime, shot.endTime),
          },
          role: placement.role,
          finalRotation: placement.rotation,
          fontSize: placement.fontSize,
          depth,
          ghostDuration: 0.5,
          isBackgroundShape: true,
        })
        return
      }
      if (segment.text === '♪' && !isDecoration) {
        if (staff) return
        staff = new StaffView(placement, typography.baseFontSize, shot.startTime, this.width, this.theme)
        textLayer.add(staff)
        if (this.tuning.showGuide) {
          const guide = new GuideView(placement, segment.startTime, segment.endTime, this.theme, hashString(`${shot.id}:${placementIndex}:${segment.text}`))
          guideLayer.add(guide)
        }
        const lineIndex = lineOfSegment[placement.segmentIndex] ?? 0
        trackingByLine[lineIndex]?.push({ position: { x: placement.x, y: placement.y }, startTime: shot.startTime })
        return
      }
      if (this.tuning.showGuide && !isDecoration) {
        const guide = new GuideView(placement, segment.startTime, segment.endTime, this.theme, hashString(`${shot.id}:${placementIndex}:${segment.text}`))
        guideLayer.add(guide)
      }
      const glyphLayout = buildGlyphs(
        segment,
        placement,
        placement.fontSize,
        (text) => measureGlyph(text, placement.fontSize, this.theme.fontWeight),
        shot.startTime,
        shot.endTime,
      )
      if (glyphLayout.length === 0) return

      const frameSpecApplied = !isDecoration && this.tuning.showFixedGeometry && this.shouldApplyFrameDecor(segment, placement)
      if (frameSpecApplied) {
        const frame = new FrameDecorView(placement, glyphLayout[0].startTime, resolveMotionDuration(shot.startTime, shot.endTime), 0, this.theme)
        behindLayer.add(frame)
        frames.push(frame)
      } else if (!isDecoration && this.tuning.showFixedGeometry && segment.isWordLike) {
        const fixed = this.buildFixedGeo(placement, segment, shot, paragraph.kind, placement.segmentIndex)
        if (fixed) {
          behindLayer.add(fixed.item)
          fixedGeos.push(fixed)
        }
      }

      glyphLayout.forEach((glyph, glyphIndex) => {
        const wrapper = new Container()
        wrapper.x = glyph.position.x
        wrapper.y = glyph.position.y
        wrapper.rotation = placement.rotation
        wrapper.alpha = 0
        const coreStyle: TextStyle = isDecoration
          ? {
              text: glyph.text,
              fontSize: placement.fontSize,
              weight: this.theme.fontWeight,
              color: glowColor,
              strokeWidth: Math.min(8, Math.max(1, placement.fontSize * 0.006)),
              fill: false,
              rasterScale: this.tuning.textureResolution,
            }
          : {
              text: glyph.text,
              fontSize: placement.fontSize,
              weight: this.theme.fontWeight,
              color: this.theme.primary,
              glowColor: withOpacity(glowColor, 0.8),
              glowSigma: Math.max(8, placement.fontSize * 0.11),
              rasterScale: this.tuning.textureResolution,
            }
        const core = new TextItem(coreStyle)
        if (isDecoration) core.alpha = 0.2
        wrapper.add(core)
        const ghosts: GhostRef[] = []
        if (placement.role === 'semi-hero') {
          const normal = placement.vertical ? { x: 1, y: 0 } : { x: 0, y: 1 }
          const cos = Math.cos(-placement.rotation)
          const sin = Math.sin(-placement.rotation)
          const normalX = normal.x * cos - normal.y * sin
          const normalY = normal.x * sin + normal.y * cos
          const side = normalSeed % 2 === 0 ? 1 : -1
          for (let layer = 1; layer <= 2; layer++) {
            const ghost = new TextItem({
              text: glyph.text,
              fontSize: placement.fontSize,
              weight: this.theme.fontWeight,
              color: glowColor,
              strokeWidth: Math.min(8, Math.max(1, placement.fontSize * 0.006)),
              fill: false,
              rasterScale: this.tuning.textureResolution,
            })
            ghost.visible = false
            wrapper.add(ghost)
            ghosts.push({
              node: ghost,
              offset: { x: normalX * side * (layer === 1 ? 1 : 1.7) * placement.fontSize * 0.85, y: normalY * side * (layer === 1 ? 1 : 1.7) * placement.fontSize * 0.85 },
              alphaBase: layer === 1 ? 0.3 : 0.16,
            })
          }
        }
        let caWrapper: Container | null = null
        let cyan: TextItem | null = null
        let red: TextItem | null = null
        if (!isDecoration && this.tuning.chromaticSplit) {
          const caAlpha = isEmphasis(placement.role) ? 0.8 : 0.5
          cyan = new TextItem({ text: glyph.text, fontSize: placement.fontSize, weight: this.theme.fontWeight, color: { r: 0, g: 1, b: 1, a: caAlpha }, rasterScale: this.tuning.textureResolution })
          red = new TextItem({ text: glyph.text, fontSize: placement.fontSize, weight: this.theme.fontWeight, color: { r: 1, g: 0, b: 0.267, a: caAlpha }, rasterScale: this.tuning.textureResolution })
          cyan.blend = 'screen'
          red.blend = 'screen'
          caWrapper = new Container()
          caWrapper.add(cyan, red)
          caLayer.add(caWrapper)
        }
        textLayer.add(wrapper)
        glyphs.push({
          wrapper,
          caWrapper,
          cyan,
          red,
          core,
          ghosts,
          placement: glyph,
          role: placement.role,
          finalRotation: placement.rotation,
          fontSize: placement.fontSize,
          depth,
          ghostDuration: Math.min(0.7, Math.max(0.4, (shot.endTime - shot.startTime) * 0.12 + 0.1)),
          isBackgroundShape: false,
        })
        if (!isDecoration) {
          const lineIndex = lineOfSegment[placement.segmentIndex] ?? 0
          trackingByLine[lineIndex]?.push({ position: { x: glyph.position.x, y: glyph.position.y }, startTime: glyph.startTime })
        }
        void glyphIndex
      })
    })

    const tracking: TrackingRef[] = trackingByLine
      .filter((glyphsForLine) => glyphsForLine.length > 0)
      .map((glyphsForLine) => ({
        glyphs: glyphsForLine,
        start: glyphsForLine[0].startTime,
        end: glyphsForLine[glyphsForLine.length - 1].startTime,
      }))
    const revealDoneTime = tracking.length > 0 ? Math.max(...tracking.map((segment) => segment.end)) : shot.endTime
    const poster = shot.kind === 'poster'
    const basePosition: Vec2 = poster
      ? { x: this.width * 0.5, y: this.height * 0.5 }
      : {
          x: this.width * (0.5 + shot.camera.x),
          y: this.height * (0.48 + shot.camera.y + (shotIndex % 2 === 1 ? 0.025 : -0.025)),
        }
    return {
      shot,
      root,
      glyphs,
      frames,
      fixedGeos,
      mg,
      focus: poster ? { x: 0, y: 0 } : heroFocus,
      basePosition,
      tracking,
      revealDoneTime,
      staff,
      placements,
    }
  }

  private shouldApplyFrameDecor(segment: SemanticSegment, placement: TypographyPlacement): boolean {
    const hash = hashString(`${segment.text}:${segment.startOffset}:${segment.endOffset}:frame-decor`)
    return (hash & 1023) / 1024 < 0.4 && placement.measuredWidth > 0
  }

  private buildFixedGeo(
    placement: TypographyPlacement,
    segment: SemanticSegment,
    shot: Shot,
    paragraphKind: ParagraphKind,
    segmentIndex: number,
  ): FixedGeoRef | null {
    let seed = 0
    for (let index = 0; index < segment.text.length; index++) seed += segment.text.charCodeAt(index)
    seed += segmentIndex * 13
    const chorus = paragraphKind === 'chorus' || seed % 100 < 35
    const state = textFixedGeometryState(seed, chorus)
    if (!state.applied) return null
    const mult = chorus ? 1.5 + (seed % 5) * 0.3 : 1
    const width = Math.max(2.5 * placement.fontSize * mult, 0.12 * this.width * mult)
    const height = Math.max(1.8 * placement.fontSize * mult, 0.08 * this.width * mult)
    const primitives = buildTextFixedGeometry(state.variant, width, height, this.theme)
    const item = new SolidItem()
    item.blend = 'screen'
    item.primitives = primitives
    item.x = placement.x
    item.y = placement.y
    item.rotation = placement.rotation
    item.alpha = 0
    const depth = -0.5 - (seed % 5) * 0.1
    void shot
    return { item, placement, depth }
  }

  private updateParagraph(view: ParagraphView, paragraphIndex: number, time: number): void {
    const paragraph = view.paragraph
    let shotIndex = 0
    for (let index = paragraph.shots.length - 1; index >= 0; index--) {
      if (time >= paragraph.shots[index].startTime) {
        shotIndex = index
        break
      }
    }
    this.activeShot = shotIndex
    const shotTransition = resolveShot(paragraph.shots, shotIndex, time, this.tuning.enableTransitions, view.transitionSeed, this.tuning.enableGlitchTransitions)
    const transitionsEnabled = this.tuning.enableTransitions
    const previousTransition = paragraphIndex > 0 ? this.program.paragraphs[paragraphIndex - 1].transitionOut : null
    const enterDuration = previousTransition ? Math.min(0.3, Math.max(0.16, previousTransition.endTime - previousTransition.startTime)) : 0
    const paragraphStart = paragraph.startTime
    const entering = transitionsEnabled && previousTransition !== null && time >= paragraphStart && time <= paragraphStart + enterDuration
    const paragraphTransition = entering
      ? resolveEnter(previousTransition.kind, time - paragraphStart, enterDuration, true, view.transitionSeed, this.tuning.enableGlitchTransitions)
      : resolveParagraph(paragraph, time, transitionsEnabled, view.transitionSeed, this.tuning.enableGlitchTransitions)
    const transition = transitionIdle(shotTransition) ? paragraphTransition : shotTransition
    const isFinal = paragraphIndex === this.program.paragraphs.length - 1
    const creditsActive = isFinal && this.credits !== null && time > (this.program.paragraphs[this.program.paragraphs.length - 1]?.endTime ?? Number.POSITIVE_INFINITY)
    const lyricAlpha = creditsActive && this.credits ? this.credits.lyricAlphaValue : 1
    const lyricBlur = creditsActive && this.credits ? this.credits.lyricBlurValue * 0.5 : 0
    view.root.alpha = transition.alpha * lyricAlpha
    this.blur = transition.blur / 14
    this.glitch = transition.glitch
    this.glitchSeed = transition.glitchSeed % 1024
    this.debugParagraph = `${paragraph.kind.toUpperCase()} ${paragraphIndex + 1}/${this.program.paragraphs.length}`
    this.debugShot = `${paragraph.shots[shotIndex]?.kind.toUpperCase() ?? ''}`
    view.shots.forEach((shotView, index) => {
      shotView.root.visible = index === shotIndex
      if (index !== shotIndex) return
      shotView.root.alpha = shotTransition.alpha
      this.updateShot(view, shotView, shotIndex, time, lyricBlur)
    })
  }

  /**
   * Final on-screen framing guard.
   *
   * Layout happens in shot-local space, but the camera then magnifies the shot
   * around its pivot and translates it. A block that fit locally can therefore
   * still leave the stage. Translate the whole shot root (never re-layout) so the
   * union of eyebrow/word blocks stays on screen while zoom and breathing remain.
   */
  private enforceFraming(shotView: ShotView): void {
    const padding = Math.min(this.width, this.height) * 0.055
    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    const cos = Math.cos(shotView.root.rotation)
    const sin = Math.sin(shotView.root.rotation)
    const scale = shotView.root.scaleX
    const collect = (x: number, y: number, width: number, height: number): void => {
      const halfWidth = (width / 2) * scale
      const halfHeight = (height / 2) * scale
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const localX = (x - shotView.root.pivotX) * scale + dx * halfWidth
        const localY = (y - shotView.root.pivotY) * scale + dy * halfHeight
        const screenX = shotView.root.x + localX * cos - localY * sin
        const screenY = shotView.root.y + localX * sin + localY * cos
        minX = Math.min(minX, screenX)
        maxX = Math.max(maxX, screenX)
        minY = Math.min(minY, screenY)
        maxY = Math.max(maxY, screenY)
      }
    }
    for (const placement of shotView.placements) {
      if (placement.role === 'decoration') continue
      collect(placement.x, placement.y, placement.measuredWidth, placement.measuredHeight)
    }
    if (!Number.isFinite(minX)) return
    let shiftX = 0
    let shiftY = 0
    if (minX < padding) shiftX = padding - minX
    else if (maxX > this.width - padding) shiftX = this.width - padding - maxX
    if (minY < padding) shiftY = padding - minY
    else if (maxY > this.height - padding) shiftY = this.height - padding - maxY
    // If the group is wider than the stage even after shifting, center it and
    // accept a bounded bleed rather than pushing one side fully off-frame.
    if (maxX - minX > this.width - padding * 2) shiftX = (this.width - (minX + maxX)) / 2
    if (maxY - minY > this.height - padding * 2) shiftY = (this.height - (minY + maxY)) / 2
    shotView.root.x += shiftX
    shotView.root.y += shiftY
  }

  private updateShot(view: ParagraphView, shotView: ShotView, shotIndex: number, time: number, lyricBlur: number): void {
    const shot = shotView.shot
    const animation = animationScale(this.theme.animationIntensity)
    const cameraIntensity = this.tuning.cameraIntensity * animation
    const motion = this.tuning.typographyMotion * animation
    let frame = shotFrame(shot.kind, shotProgress(shot, time))
    const gapTime = Math.max(0, time - shot.endTime)
    if (gapTime > 0) {
      const tail = shotFrame(shot.kind, 0.8)
      const drift = (1 - Math.exp(-gapTime * 0.4)) * 2
      frame = {
        x: frame.x + (frame.x - tail.x) * drift,
        y: frame.y + (frame.y - tail.y) * drift,
        scale: frame.scale + (frame.scale - tail.scale) * drift,
        rotation: frame.rotation + (frame.rotation - tail.rotation) * drift,
      }
    }
    const breathWeightValue = breathWeight(time, shotView.revealDoneTime)
    if (breathWeightValue > 0) {
      const phase = ((hashString(shot.id) % 1024) / 1024) * Math.PI * 2
      const breath = cameraBreath(time, phase)
      frame = {
        x: frame.x + breath.x * breathWeightValue,
        y: frame.y + breath.y * breathWeightValue,
        scale: frame.scale + breath.scale * breathWeightValue,
        rotation: frame.rotation + breath.rotation * breathWeightValue,
      }
    }
    void 0
    const focus = shot.kind === 'poster'
      ? { x: 0, y: 0 }
      : shotView.tracking.length > 0
        ? smoothedTrackingFocus(
            shotView.tracking.map((segment) => ({ glyphs: segment.glyphs, start: segment.start, end: segment.end })),
            time,
            shot.startTime,
            shot.endTime,
          )
        : shotView.focus
    const pivot = lerpVec(shotView.focus, focus, cameraIntensity)
    shotView.root.pivotX = pivot.x
    shotView.root.pivotY = pivot.y
    shotView.root.x = shotView.basePosition.x + this.width * frame.x * cameraIntensity
    shotView.root.y = shotView.basePosition.y + this.height * frame.y * cameraIntensity
    // The compile-time zoom assumes a landscape stage. Portrait/narrow stages get
    // a gentler base zoom so the hero is not cropped away by the focus transform.
    const aspectZoom = Math.min(1, Math.max(0.72, this.width / this.height / 2.2))
    shotView.root.scaleX = shot.camera.zoom * aspectZoom * (1 + (frame.scale - 1) * cameraIntensity)
    shotView.root.scaleY = shotView.root.scaleX
    shotView.root.rotation = (shot.camera.rotation + frame.rotation) * cameraIntensity
    this.enforceFraming(shotView)
    const cameraOffset = { x: this.width * frame.x * cameraIntensity, y: this.height * frame.y * cameraIntensity }
    shotView.mg.audio = this.audio
    shotView.mg.setCamera(cameraOffset, frame.scale, shotView.root.rotation)
    shotView.root.update(time, 0)
    this.debugMg = shotView.mg.debugLabel
    if (shotView.staff) shotView.staff.alpha = 0.16 + 0.84 * segmentProgress(shot.startTime, shot.startTime + 0.8, time)
    for (const frameDecor of shotView.frames) {
      if (!this.tuning.showFixedGeometry) frameDecor.visible = false
    }
    const creditsActive = lyricBlur > 0
    for (const glyph of shotView.glyphs) {
      const p = segmentProgress(glyph.placement.startTime, glyph.placement.settleTime, time)
      const waiting = time < glyph.placement.startTime
      const offset = (1 - p) * motion
      const coreAlpha = waiting ? 0 : 0.16 + 0.84 * p
      const scale = isEmphasis(glyph.role) && shot.kind === 'impact'
        ? 0.52 + p * 0.48
        : 0.86 + p * 0.14
      const parallax = { x: cameraOffset.x * glyph.depth * 2.5, y: cameraOffset.y * glyph.depth * 2.5 }
      const depthScale = 1 + glyph.depth * 0.45
      const wrapper = glyph.wrapper
      wrapper.alpha = coreAlpha
      wrapper.scaleX = scale * depthScale
      wrapper.scaleY = scale * depthScale
      wrapper.x = glyph.placement.position.x + glyph.placement.entrance.x * offset + parallax.x
      wrapper.y = glyph.placement.position.y + glyph.placement.entrance.y * offset + parallax.y
      wrapper.rotation = glyph.finalRotation + glyph.placement.entryRotation * offset
      if (glyph.caWrapper && glyph.cyan && glyph.red) {
        glyph.caWrapper.x = wrapper.x
        glyph.caWrapper.y = wrapper.y
        glyph.caWrapper.rotation = wrapper.rotation
        glyph.caWrapper.scaleX = wrapper.scaleX
        glyph.caWrapper.scaleY = wrapper.scaleY
        glyph.caWrapper.alpha = coreAlpha
        const caOffset = glyph.fontSize * (isEmphasis(glyph.role) ? 0.025 : 0.01) * (1 - easeInOut(p) * 0.8)
        glyph.cyan.x = -caOffset
        glyph.cyan.y = caOffset * 0.5
        glyph.red.x = caOffset
        glyph.red.y = -caOffset * 0.5
      }
      if (glyph.ghosts.length > 0) {
        const ghostProgress = clamp01((time - glyph.placement.startTime) / glyph.ghostDuration)
        const active = coreAlpha > 0 && ghostProgress > 0 && ghostProgress < 1
        const envelope = ghostProgress <= 0.2 ? ghostProgress / 0.2 : Math.pow(1 - (ghostProgress - 0.2) / 0.8, 2)
        const spread = 1 - Math.pow(1 - ghostProgress, 3)
        for (const ghost of glyph.ghosts) {
          ghost.node.visible = active
          if (!active) continue
          ghost.node.x = ghost.offset.x * spread
          ghost.node.y = ghost.offset.y * spread
          ghost.node.alpha = envelope * ghost.alphaBase
        }
      }
      glyph.core.blur = creditsActive ? lyricBlur : 0
    }
    for (const fixed of shotView.fixedGeos) {
      const p = segmentProgress(shot.startTime, shot.startTime + 0.9, time)
      const alpha = time < shot.startTime ? 0 : 0.16 + 0.84 * p
      fixed.item.alpha = alpha
      fixed.item.scaleX = 1 + fixed.depth * 0.45
      fixed.item.scaleY = fixed.item.scaleX
      fixed.item.x = fixed.placement.x + cameraOffset.x * fixed.depth * 2.5
      fixed.item.y = fixed.placement.y + cameraOffset.y * fixed.depth * 2.5
    }
  }

  get activeParagraphIndex(): number {
    return this.activeParagraph
  }

  get activeShotIndex(): number {
    return this.activeShot
  }

  snapshot(): unknown {
    const view = this.cache.get(this.activeParagraph)
    const shotView = view?.shots[this.activeShot]
    if (!view || !shotView) return null
    return {
      size: { width: this.width, height: this.height },
      seed: this.program.seed,
      paragraph: view.paragraph.kind,
      paragraphIndex: this.activeParagraph,
      transitionOut: view.paragraph.transitionOut,
      blur: this.blur,
      glitch: this.glitch,
      shot: shotView.shot.kind,
      root: {
        x: shotView.root.x,
        y: shotView.root.y,
        pivotX: shotView.root.pivotX,
        pivotY: shotView.root.pivotY,
        scale: shotView.root.scaleX,
        rotation: shotView.root.rotation,
        alpha: shotView.root.alpha,
      },
      base: shotView.basePosition,
      focus: shotView.focus,
      placements: shotView.placements.slice(0, 18).map((placement) => ({
        text: placement.displayText,
        role: placement.role,
        x: Math.round(placement.x),
        y: Math.round(placement.y),
        font: Math.round(placement.fontSize),
        w: Math.round(placement.measuredWidth),
        h: Math.round(placement.measuredHeight),
        enterX: Math.round(placement.enterX),
        enterY: Math.round(placement.enterY),
      })),
      glyphs: shotView.glyphs.slice(0, 24).map((glyph) => ({
        text: glyph.core.style.text,
        role: glyph.role,
        x: Math.round(glyph.wrapper.x),
        y: Math.round(glyph.wrapper.y),
        alpha: Number(glyph.wrapper.alpha.toFixed(2)),
        scale: Number(glyph.wrapper.scaleX.toFixed(2)),
        font: Math.round(glyph.fontSize),
        start: Number(glyph.placement.startTime.toFixed(2)),
      })),
    }
  }
}

export function paragraphKindLabel(kind: ParagraphKind): string {
  return kind.toUpperCase()
}

export function shotKindLabel(kind: ShotKind): string {
  return kind.toUpperCase()
}

export function intensityLabel(intensity: AnimationIntensity): string {
  return intensity.toUpperCase()
}

export function textStyleForSegment(segment: SemanticSegment, fontSize: number, theme: Theme, tuning: Tuning): TextStyle {
  return {
    text: segment.text,
    fontSize,
    weight: theme.fontWeight,
    color: theme.primary,
    glowColor: withOpacity(theme.accent, 0.8),
    glowSigma: Math.max(8, fontSize * 0.11),
    rasterScale: tuning.textureResolution,
  }
}

export function measureSegmentWidth(segment: SemanticSegment, fontSize: number, weight: number): number {
  return measureText(segment.text, fontSize, weight).width
}

export function solidWithAlpha(primitives: SolidPrimitive[], alpha: number, blend: BlendMode): SolidItem {
  const item = new SolidItem()
  item.primitives = primitives
  item.alpha = alpha
  item.blend = blend
  return item
}
