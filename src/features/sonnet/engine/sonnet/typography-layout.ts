import { clamp } from '../math'
import { hashString } from '../random'
import type { SegmentRole, SemanticSegment, ShotKind } from './types'
import type { TypographyPlacement } from './glyph-layout'
import { findHeroIndex, findSemiHeroIndices, isEmphasis } from './roles'
import { measureGlyph, measureText } from './measure'
import { splitGraphemes } from './lyric-timeline'

interface Box {
  index: number
  text: string
  role: SegmentRole
  fontScale: number
  width: number
  height: number
  vertical: boolean
  rotation: number
  x: number
  y: number
  enterX: number
  enterY: number
  layoutDirection: 'horizontal' | 'vertical'
  verticalText?: string
  verticalWidth?: number
  verticalHeight?: number
  verticalScale?: number
}

const globalFitScales = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52]

const cjk = (text: string): boolean => /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(text)

interface LayoutContext {
  boxes: Box[]
  heroIndex: number
  width: number
  height: number
  flowGap: number
  stackGap: number
}

function resolveGaps(baseFontSize: number, minDimension: number): { flowGap: number; stackGap: number } {
  // Gaps must scale with the stage, not only with type size: a 900px-wide hero
  // next to a 60px support word needs real breathing room, not a 16px gutter.
  const flowGap = clamp(baseFontSize * 0.35, Math.max(24, minDimension * 0.045), Math.max(44, minDimension * 0.06))
  return { flowGap, stackGap: Math.max(30, minDimension * 0.055, flowGap * 1.3) }
}

/**
 * Type-size ceiling per role. The compiler's base size and hero multiplier are
 * tuned for a 1280×720 landscape stage; on wide screens they can produce glyphs
 * larger than the stage, which then pile on top of each other.
 */
function maxFontForRole(role: SegmentRole, minDimension: number): number {
  if (role === 'hero') return minDimension * 0.34
  if (role === 'semi-hero') return minDimension * 0.19
  return minDimension * 0.12
}

function placeWithGlobalFit(_context: LayoutContext, place: () => void): void {
  // A single flow pass. The uniform bounding-box fit in resolveTypography scales
  // positions and type together once, which preserves the composition hierarchy.
  place()
}

function layoutQuiet(context: LayoutContext, variant: number): void {
  const { boxes, heroIndex, width, height, stackGap } = context
  const hero = boxes[heroIndex]
  const horizontalCard = variant === 2 || variant === 3
  for (const box of boxes) box.layoutDirection = horizontalCard ? 'horizontal' : 'vertical'
  const safeHalfHeight = height * 0.46
  placeWithGlobalFit(context, () => {
    hero.x = 0
    hero.y = horizontalCard ? 0 : -height * 0.1
    const stagger = variant === 3 ? 70 : 0
    const columnStep = Math.max(...boxes.map((box) => box.width)) + stackGap + stagger
    const xFor = (box: Box, index: number): number => {
      if (variant === 1) return hero.x - hero.width / 2 + box.width / 2
      if (variant === 3) return hero.x + (index % 2 === 0 ? 1 : -1) * 35
      return hero.x
    }
    let column = 0
    let currentY = hero.y - hero.height / 2 - stackGap
    for (let index = heroIndex - 1; index >= 0; index--) {
      const box = boxes[index]
      if (currentY - box.height < -safeHalfHeight) {
        column++
        currentY = safeHalfHeight
      }
      box.x = xFor(box, index) + column * columnStep
      box.y = currentY - box.height / 2
      currentY -= box.height + stackGap
      box.enterX = variant === 1 ? 20 : variant === 3 ? (box.x > hero.x ? 30 : -30) : 0
      box.enterY = variant === 1 || variant === 3 ? 0 : 20
    }
    column = 0
    currentY = hero.y + hero.height / 2 + stackGap
    for (let index = heroIndex + 1; index < boxes.length; index++) {
      const box = boxes[index]
      if (currentY + box.height > safeHalfHeight) {
        column++
        currentY = -safeHalfHeight
      }
      box.x = xFor(box, index) - column * columnStep
      box.y = currentY + box.height / 2
      currentY += box.height + stackGap
      box.enterX = variant === 1 ? -20 : variant === 3 ? (box.x > hero.x ? 30 : -30) : 0
      box.enterY = variant === 1 || variant === 3 ? 0 : -20
    }
  })
}

function layoutRibbon(context: LayoutContext, variant: number): void {
  const { boxes, heroIndex, flowGap } = context
  const hero = boxes[heroIndex]
  for (const box of boxes) box.layoutDirection = 'horizontal'
  placeWithGlobalFit(context, () => {
    hero.x = 0
    hero.y = 0
    const alignY = (box: Box, index: number): number => {
      if (variant === 1) return hero.y + hero.height / 2 - box.height / 2
      if (variant === 2) return hero.y - hero.height / 2 + box.height / 2
      return hero.y + (index % 2 === 0 ? 10 : -10)
    }
    const enter = variant === 2 ? 20 : 30
    let currentX = hero.x - hero.width / 2 - flowGap
    for (let index = heroIndex - 1; index >= 0; index--) {
      const box = boxes[index]
      box.x = currentX - box.width / 2
      box.y = alignY(box, index)
      currentX -= box.width + flowGap
      box.enterX = enter
      box.enterY = 0
    }
    currentX = hero.x + hero.width / 2 + flowGap
    for (let index = heroIndex + 1; index < boxes.length; index++) {
      const box = boxes[index]
      box.x = currentX + box.width / 2
      box.y = alignY(box, index)
      currentX += box.width + flowGap
      box.enterX = -enter
      box.enterY = 0
    }
  })
}

function layoutEditorial(context: LayoutContext, variant: number): void {
  const { boxes, heroIndex, width, height, flowGap } = context
  const hero = boxes[heroIndex]
  if (variant === 2) {
    for (const box of boxes) box.layoutDirection = 'horizontal'
    placeWithGlobalFit(context, () => {
      hero.x = 0
      hero.y = -height * 0.25
      let cursorY = hero.y - hero.height / 2 - flowGap
      for (let index = heroIndex - 1; index >= 0; index--) {
        const box = boxes[index]
        box.x = 0
        box.y = cursorY - box.height / 2
        cursorY -= box.height + flowGap
        box.enterX = 0
        box.enterY = 20
      }
      cursorY = hero.y + hero.height / 2 + flowGap + 16
      for (let index = heroIndex + 1; index < boxes.length; index++) {
        const box = boxes[index]
        const side = index % 2 === 0 ? 1 : -1
        box.x = side * (hero.width * 0.25 + flowGap + box.width / 2)
        box.y = cursorY
        cursorY += box.height + flowGap
        box.enterX = side * 20
        box.enterY = 0
      }
    })
    return
  }
  if (variant === 3 || variant === 4) {
    for (const box of boxes) box.layoutDirection = 'horizontal'
    placeWithGlobalFit(context, () => {
      hero.x = variant === 4 ? -width * 0.27 : 0
      hero.y = -height * 0.12
      let rowRight = hero.x + hero.width / 2 + flowGap
      let previousCount = 0
      for (let index = heroIndex - 1; index >= 0; index--) {
        const box = boxes[index]
        box.x = rowRight + box.width / 2
        box.y = hero.y + previousCount * (box.height + flowGap * 0.5)
        rowRight += box.width + flowGap
        box.enterX = 30
        box.enterY = 0
        previousCount++
      }
      let rowY = hero.y + hero.height / 2 + flowGap + 10
      let rowX = variant === 4 ? -width * 0.32 : -width * 0.18
      for (let index = heroIndex + 1; index < boxes.length; index++) {
        const box = boxes[index]
        if (rowX + box.width > width * 0.46) {
          rowX = -width * 0.18
          rowY += box.height + flowGap
        }
        box.x = rowX + box.width / 2
        box.y = rowY + box.height / 2
        rowX += box.width + flowGap
        box.enterX = -30
        box.enterY = 0
      }
    })
    return
  }
  for (const box of boxes) box.layoutDirection = 'vertical'
  placeWithGlobalFit(context, () => {
    hero.x = -width * 0.15
    hero.y = 0
    let cursorX = hero.x + hero.width / 2 + flowGap
    for (let index = heroIndex - 1; index >= 0; index--) {
      const box = boxes[index]
      box.x = cursorX + box.width / 2
      box.y = 0
      cursorX += box.width + flowGap
      box.enterX = -20
      box.enterY = 0
    }
    cursorX = hero.x - hero.width / 2 - flowGap
    for (let index = heroIndex + 1; index < boxes.length; index++) {
      const box = boxes[index]
      box.x = cursorX - box.width / 2
      box.y = 0
      cursorX -= box.width + flowGap
      box.enterX = 20
      box.enterY = 0
    }
  })
}

function layoutCollage(context: LayoutContext): void {
  const { boxes, heroIndex, flowGap, stackGap } = context
  const hero = boxes[heroIndex]
  const radius = Math.hypot(hero.width, hero.height) / 2 + stackGap
  placeWithGlobalFit(context, () => {
    hero.x = 0
    hero.y = 0
    let angle = Math.PI / 4
    let ring = 0
    for (let index = 0; index < boxes.length; index++) {
      if (index === heroIndex) continue
      const box = boxes[index]
      const currentRadius = radius + ring * (stackGap + 24) + (index % 3) * flowGap
      const x = Math.cos(angle) * currentRadius
      const y = Math.sin(angle) * currentRadius * 0.65
      box.x = x
      box.y = y
      box.enterX = -60 * Math.cos(angle)
      box.enterY = -60 * Math.sin(angle)
      box.layoutDirection = Math.abs(Math.cos(angle)) >= Math.abs(Math.sin(angle)) ? 'horizontal' : 'vertical'
      angle += 0.78
      if (index % 9 === 0) ring++
    }
  })
}

function layoutCross(context: LayoutContext): void {
  const { boxes, heroIndex, flowGap } = context
  const hero = boxes[heroIndex]
  placeWithGlobalFit(context, () => {
    hero.x = 0
    hero.y = 0
    const columnTop = -hero.height * 0.42
    const columnBottom = hero.height * 0.42
    const placeColumn = (group: Box[], side: number): void => {
      let cursorY = columnTop
      let column = 0
      for (const box of group) {
        if (cursorY + box.height > columnBottom && cursorY > columnTop) {
          column++
          cursorY = columnTop
        }
        const x = side * (hero.width / 2 + flowGap + box.width / 2)
        box.x = x + side * column * (box.width + flowGap)
        box.y = cursorY + box.height / 2
        cursorY += box.height + flowGap * 0.45
        box.enterX = side * 30
        box.enterY = 0
      }
    }
    placeColumn(boxes.slice(0, heroIndex), -1)
    placeColumn(boxes.slice(heroIndex + 1), 1)
  })
}

function layoutPoster(context: LayoutContext): void {
  const { boxes, heroIndex, width, height, flowGap } = context
  const hero = boxes[heroIndex]
  placeWithGlobalFit(context, () => {
    hero.x = -width * 0.19
    hero.y = -height * 0.1
    let column = 0
    let row = 0
    const columnWidth = width * 0.27
    for (let index = 0; index < boxes.length; index++) {
      if (index === heroIndex) continue
      const box = boxes[index]
      const x = width * 0.13 + column * columnWidth
      const y = -height * 0.28 + row * (box.height + flowGap * 0.85)
      box.x = x
      box.y = y
      box.enterX = index % 2 === 0 ? 28 : -28
      box.enterY = 18
      row++
      if (row >= 3) {
        row = 0
        column++
      }
    }
  })
}

interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
}

function boxBounds(box: Box, gap: number): Bounds {
  const rotated = Math.abs(Math.sin(box.rotation)) > 0.5
  // Glyph ink spills slightly past the measured advance (side bearings, outline),
  // so reserve a little more than half the gutter on every side.
  const halfWidth = (rotated ? box.height : box.width) / 2 + gap * 0.65
  const halfHeight = (rotated ? box.width : box.height) / 2 + gap * 0.65
  return { left: box.x - halfWidth, right: box.x + halfWidth, top: box.y - halfHeight, bottom: box.y + halfHeight }
}

function overlapArea(a: Bounds, b: Bounds): number {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return width > 0 && height > 0 ? width * height : 0
}

/**
 * Separating-axis pass for composed word blocks. Flow layouts place words by
 * chain arithmetic, which can stack a long hero against a neighbouring support
 * word; this pushes them apart along the cheaper axis until nothing overlaps.
 */
function separateOnce(boxes: Box[], gap: number): boolean {
  let moved = false
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      const boundsA = boxBounds(a, gap)
      const boundsB = boxBounds(b, gap)
      if (overlapArea(boundsA, boundsB) <= 0) continue
      const overlapX = Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left)
      const overlapY = Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top)
      if (overlapX <= 0 || overlapY <= 0) continue
      const directionX = Math.sign(b.x - a.x) || 1
      const directionY = Math.sign(b.y - a.y) || 1
      // Push by the full overlap plus the gutter, split between the pair, so one
      // pass actually clears the pair instead of inching them apart.
      if (overlapX < overlapY) {
        const push = (overlapX + gap) * directionX
        a.x -= push / 2
        b.x += push / 2
      } else {
        const push = (overlapY + gap) * directionY
        a.y -= push / 2
        b.y += push / 2
      }
      moved = true
    }
  }
  return moved
}

function countOverlaps(boxes: Box[], gap: number): number {
  let count = 0
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (overlapArea(boxBounds(boxes[i], gap), boxBounds(boxes[j], gap)) > 0) count++
    }
  }
  return count
}

let stageInset = 1

/**
 * The shot root is magnified by the compiled camera zoom (1.22–1.48×) and
 * pivots around the tracked focus, which is usually near one edge of the
 * composition. Reserve room in local units for that on-screen transform,
 * otherwise a hero that fits mathematically still gets cropped.
 */
export function setLayoutCameraZoom(zoom: number): void {
  // Only the outer fit reserves room for the camera; collision clamping must not
  // use this, otherwise it squeezes blocks back together mid-separation.
  stageInset = Math.max(1, Math.min(1.35, zoom))
}

function clampIntoStage(boxes: Box[], width: number, height: number, marginX = 0.5, marginY = 0.47): void {
  const safeHalfWidth = width * marginX
  const safeHalfHeight = height * marginY
  for (const box of boxes) {
    const bounds = boxBounds(box, 0)
    const halfWidth = (bounds.right - bounds.left) / 2
    const halfHeight = (bounds.bottom - bounds.top) / 2
    box.x = clamp(box.x, -safeHalfWidth + halfWidth, safeHalfWidth - halfWidth)
    box.y = clamp(box.y, -safeHalfHeight + halfHeight, safeHalfHeight - halfHeight)
  }
}

function nudgeIntoStage(boxes: Box[], width: number, height: number, gap: number): void {
  for (const box of boxes) {
    const bounds = boxBounds(box, 0)
    const halfWidth = (bounds.right - bounds.left) / 2
    const halfHeight = (bounds.bottom - bounds.top) / 2
    const safeHalfWidth = width * 0.5
    const safeHalfHeight = height * 0.47
    if (box.x - halfWidth < -safeHalfWidth) box.x = -safeHalfWidth + halfWidth
    if (box.x + halfWidth > safeHalfWidth) box.x = safeHalfWidth - halfWidth
    if (box.y - halfHeight < -safeHalfHeight) box.y = -safeHalfHeight + halfHeight
    if (box.y + halfHeight > safeHalfHeight) box.y = safeHalfHeight - halfHeight
  }
}

function resolveCollisions(boxes: Box[], width: number, height: number, gap: number): void {
  if (boxes.length < 2) return
  // Separate first, then clamp. Clamping re-introduces contact, so retry with a
  // shrinking gutter before ever shrinking type: readable glyph size is the point.
  for (let attempt = 0; attempt < 5; attempt++) {
    const currentGap = gap * Math.pow(0.62, attempt)
    for (let iteration = 0; iteration < 48; iteration++) {
      if (!separateOnce(boxes, currentGap)) break
    }
    clampIntoStage(boxes, width, height)
    if (countOverlaps(boxes, 0) === 0) return
    nudgeIntoStage(boxes, width, height, currentGap)
  }

  // Last resort: a bounded uniform shrink, then one final separation pass.
  for (let attempt = 0; attempt < 4 && countOverlaps(boxes, 0) > 0; attempt++) {
    const factor = 0.92
    for (const box of boxes) {
      box.x *= factor
      box.y *= factor
      box.width *= factor
      box.height *= factor
      box.fontScale *= factor
    }
    for (let iteration = 0; iteration < 32; iteration++) {
      if (!separateOnce(boxes, 0)) break
    }
    clampIntoStage(boxes, width, height)
  }
}

/**
 * Uniform shrink so the composition survives the shot camera.
 *
 * The shot root zooms around the hero (or the tracked focus near it), so the
 * meaningful distance is each block's offset *from the hero*, not from the
 * stage center. Scaling every coordinate keeps that relationship intact.
 */
function fitIntoStage(boxes: Box[], width: number, height: number, heroIndex: number): void {
  if (boxes.length === 0) return
  const hero = boxes[Math.min(heroIndex, boxes.length - 1)]
  const anchorX = hero?.x ?? 0
  const anchorY = hero?.y ?? 0
  let maxX = 0
  let maxY = 0
  for (const box of boxes) {
    const rotated = Math.abs(Math.sin(box.rotation)) > 0.5
    const halfWidth = (rotated ? box.height : box.width) / 2
    const halfHeight = (rotated ? box.width : box.height) / 2
    maxX = Math.max(maxX, Math.abs(box.x - anchorX) + halfWidth)
    maxY = Math.max(maxY, Math.abs(box.y - anchorY) + halfHeight)
  }
  const safeFit = Math.min(
    1,
    (width * 0.46) / stageInset / Math.max(1, maxX),
    (height * 0.45) / stageInset / Math.max(1, maxY),
  )
  if (safeFit >= 1) return
  for (const box of boxes) {
    box.x *= safeFit
    box.y *= safeFit
    box.width *= safeFit
    box.height *= safeFit
    box.fontScale *= safeFit
  }
}

export interface TypographyResult {
  placements: TypographyPlacement[]
  baseFontSize: number
}

export function resolveTypography(
  lines: SemanticSegment[][],
  shotKind: ShotKind,
  width: number,
  height: number,
  themeWeight: number,
  cameraZoom = 1.3,
): TypographyResult {
  const segments = lines.flat()
  if (segments.length === 0) return { placements: [], baseFontSize: 24 }
  const roles: SegmentRole[] = new Array(segments.length).fill('support')
  let offset = 0
  for (const line of lines) {
    const hero = findHeroIndex(line)
    if (hero >= 0) roles[offset + hero] = 'hero'
    for (const semi of findSemiHeroIndices(line, hero)) roles[offset + semi] = 'semi-hero'
    offset += line.length
  }
  const startTime = Math.min(...segments.map((segment) => (segment.startTime + segment.endTime) / 2))
  const endTime = Math.max(...segments.map((segment) => (segment.startTime + segment.endTime) / 2))
  const layoutVariantSeed = segments.reduce((sum, segment) => sum + Math.max(1, segment.text.trim().length), 0) + segments.length
  const globalHeroIndex = findHeroIndex(segments)
  let editorialVariant = layoutVariantSeed % 5
  if (editorialVariant === 3 && globalHeroIndex >= 0) {
    let secondaryHeroIndex = -1
    for (let index = 0; index < segments.length; index++) {
      if (!isEmphasis(roles[index]) || index === globalHeroIndex || !segments[index].isWordLike) continue
      if (secondaryHeroIndex < 0) secondaryHeroIndex = index
    }
    if (secondaryHeroIndex < 0) editorialVariant = 0
  } else if (editorialVariant === 3 || (editorialVariant === 4 && segments.length < 2)) {
    editorialVariant = 0
  }
  const wordCount = Math.max(1, segments.filter((segment) => segment.isWordLike).length)
  const heroBoost = shotKind === 'impact' ? 1.55 : shotKind === 'quiet' ? 0.82 : 1
  const minDimension = Math.min(width, height)
  const baseLimit = Math.min(112, minDimension * 0.13)
  const baseFontSize = Math.min(clamp((width / Math.max(7, wordCount * 2.15)) * heroBoost, 24, 112), baseLimit)
  const { flowGap, stackGap } = resolveGaps(baseFontSize, minDimension)
  const boxes: Box[] = []

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index]
    const role = roles[index]
    let heroScale: number
    let supportScale: number
    let verticalIntent = false
    switch (shotKind) {
      case 'editorial':
        heroScale = editorialVariant === 2 ? 3.2 : editorialVariant === 3 ? 3.8 : editorialVariant === 4 ? 4.2 : 4
        supportScale = editorialVariant === 3 ? 1.3 : editorialVariant === 4 ? 1.25 : 1.2
        verticalIntent = isEmphasis(role) && editorialVariant !== 2
        break
      case 'impact':
        heroScale = 5.5
        supportScale = 1.5
        break
      case 'collage':
        heroScale = 3.2
        supportScale = 1.35
        verticalIntent = role === 'semi-hero' || index % 4 === 0
        break
      case 'ribbon':
        heroScale = 3.5
        supportScale = 1.5
        break
      case 'mask':
        heroScale = 4.5
        supportScale = 1.6
        verticalIntent = isEmphasis(role)
        break
      case 'poster':
        heroScale = 4.4
        supportScale = 1.15
        break
      default:
        heroScale = 3
        supportScale = 1.15
        verticalIntent = isEmphasis(role) && layoutVariantSeed % 4 <= 1
    }
    const scale = role === 'hero' ? heroScale : role === 'semi-hero' ? Math.max(supportScale * 1.35, heroScale * 0.72) : supportScale
    const chars = segment.graphemes.length > 0 ? segment.graphemes.map((glyph) => glyph.text) : splitGraphemes(segment.text)
    const rotatesNonCjk = verticalIntent && chars.length > 1 && !cjk(segment.text)
    const vertical = verticalIntent && !rotatesNonCjk
    const rotation = rotatesNonCjk ? Math.PI / 2 : 0
    const display = vertical ? chars.join('\n') : segment.text
    const roleCeiling = maxFontForRole(role, minDimension)
    const cappedScale = Math.min(scale, roleCeiling / Math.max(1, baseFontSize))
    const fontSize = baseFontSize * cappedScale
    const weight = themeWeight
    let measuredWidth: number
    let measuredHeight: number
    if (rotatesNonCjk) {
      const advance = chars.reduce((sum, char) => sum + measureGlyph(char, fontSize, weight), 0)
      measuredWidth = fontSize * 1.2
      measuredHeight = advance
    } else if (vertical) {
      measuredWidth = Math.max(fontSize, ...chars.map((char) => measureGlyph(char, fontSize, weight)))
      measuredHeight = Math.max(1, chars.length) * fontSize * 0.9
    } else {
      measuredWidth = measureText(display, fontSize, weight).width
      measuredHeight = fontSize * 1.2
    }
    const fit = Math.min(1, Math.min((width * 0.82) / Math.max(1, measuredWidth), (height * 0.82) / Math.max(1, measuredHeight)))
    boxes.push({
      index,
      text: display,
      role,
      fontScale: cappedScale * fit,
      width: measuredWidth * fit,
      height: measuredHeight * fit,
      vertical,
      rotation,
      x: 0,
      y: 0,
      enterX: 0,
      enterY: 0,
      layoutDirection: vertical ? 'vertical' : 'horizontal',
      verticalText: vertical ? chars.join('\n') : undefined,
    })
  }

  const heroIndex = Math.max(0, findHeroIndex(segments))
  const context: LayoutContext = { boxes, heroIndex, width, height, flowGap, stackGap }
  switch (shotKind) {
    case 'quiet': layoutQuiet(context, layoutVariantSeed % 4); break
    case 'ribbon': layoutRibbon(context, layoutVariantSeed % 4); break
    case 'editorial': layoutEditorial(context, editorialVariant); break
    case 'collage': layoutCollage(context); break
    case 'impact':
    case 'mask': layoutCross(context); break
    case 'poster': layoutPoster(context); break
  }

  setLayoutCameraZoom(cameraZoom)
  resolveCollisions(boxes, width, height, flowGap)
  fitIntoStage(boxes, width, height, heroIndex)

  const placements: TypographyPlacement[] = boxes.map((box) => ({
    segmentIndex: box.index,
    displayText: box.text,
    role: box.role,
    fontScale: box.fontScale,
    measuredWidth: box.width,
    measuredHeight: box.height,
    x: box.x,
    y: box.y,
    rotation: box.rotation,
    enterX: box.enterX,
    enterY: box.enterY,
    vertical: box.vertical,
    phase: endTime - startTime > 0.001 ? (segments[box.index].startTime - startTime) / (endTime - startTime) : box.index / Math.max(1, segments.length - 1),
    layoutDirection: box.layoutDirection,
    fontSize: baseFontSize * box.fontScale,
  }))

  if (globalHeroIndex >= 0 && shotKind !== 'quiet' && shotKind !== 'poster') {
    const decorations = resolveDecorations(placements, width, height)
    placements.unshift(...decorations)
  }
  return { placements, baseFontSize }
}

function resolveDecorations(placements: TypographyPlacement[], width: number, height: number): TypographyPlacement[] {
  const decorations: TypographyPlacement[] = []
  const heroes = placements.filter((placement) => placement.role === 'hero')
  heroes.forEach((hero, index) => {
    // Decorative echoes are intentionally oversized, but bounded so they stay a
    // background texture instead of filling the frame behind real lyrics.
    const scale = Math.max(2.2, Math.min(hero.fontScale * 2.6, 4.4))
    const ratio = scale / hero.fontScale
    decorations.push({
      ...hero,
      role: 'decoration',
      fontScale: scale,
      measuredWidth: hero.measuredWidth * ratio,
      measuredHeight: hero.measuredHeight * ratio,
      vertical: false,
      x: hero.x - width * (0.1 - index * 0.03),
      y: hero.y - height * (0.05 - index * 0.02),
      rotation: -0.15 + (index % 2 === 0 ? 0 : 0.05),
      enterX: -width * 0.05,
      enterY: -height * 0.05,
      fontSize: hero.fontSize * ratio,
    })
  })
  if (heroes.length > 0) {
    const base = placements[placements.length - 1]?.role === 'hero' ? placements[0] : placements[placements.length - 1]
    const hero = heroes[0]
    const scale = Math.max(1.8, Math.min(hero.fontScale * 2.2, 3.5))
    const ratio = scale / base.fontScale
    decorations.push({
      ...base,
      role: 'decoration',
      fontScale: scale,
      measuredWidth: base.measuredWidth * ratio,
      measuredHeight: base.measuredHeight * ratio,
      vertical: false,
      x: hero.x + width * 0.25,
      y: hero.y + height * 0.15,
      rotation: 0.08,
      enterX: width * 0.05,
      enterY: height * 0.05,
      fontSize: base.fontSize * ratio,
    })
  }
  return decorations
}
