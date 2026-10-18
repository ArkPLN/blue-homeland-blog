import { LYRIC_FONT_FAMILY } from '../gl/texture-cache'

let context: CanvasRenderingContext2D | null = null
let unavailable = false

function getContext(): CanvasRenderingContext2D | null {
  if (context || unavailable) return context
  if (typeof document === 'undefined') {
    unavailable = true
    return null
  }
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    unavailable = true
    return null
  }
  context = ctx
  return context
}

function fontString(fontSize: number, weight: number): string {
  return `${weight >= 700 ? 700 : 400} ${fontSize}px ${LYRIC_FONT_FAMILY}`
}

/** CJK glyphs are square; this keeps layout testable without a DOM canvas. */
function fallbackWidth(text: string, fontSize: number): number {
  let width = 0
  for (const char of text) {
    if (/\s/u.test(char)) width += fontSize * 0.35
    else if (/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(char)) width += fontSize
    else width += fontSize * 0.58
  }
  return width
}

export function measureText(text: string, fontSize: number, weight: number): { width: number; height: number } {
  const ctx = getContext()
  if (!ctx) return { width: Math.max(1, fallbackWidth(text, fontSize)), height: fontSize * 1.2 }
  ctx.font = fontString(fontSize, weight)
  const metrics = ctx.measureText(text)
  return { width: Math.max(1, metrics.width), height: fontSize * 1.2 }
}

export function measureGlyph(text: string, fontSize: number, weight: number): number {
  const ctx = getContext()
  if (!ctx) return Math.max(fontSize * 0.2, fallbackWidth(text, fontSize))
  ctx.font = fontString(fontSize, weight)
  return Math.max(fontSize * 0.2, ctx.measureText(text).width)
}
