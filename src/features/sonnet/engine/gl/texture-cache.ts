import type { TextStyle, TextDraw } from './types'
import { clamp } from '../math'

export const LYRIC_FONT_FAMILY =
  '"Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", "PingFang SC", sans-serif'

const colorKey = (color: { r: number; g: number; b: number; a: number }): string =>
  `${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${color.a.toFixed(3)}`

export class TextTextureCache {
  private readonly gl: WebGL2RenderingContext
  private readonly entries = new Map<string, TextDraw & { lastUsed: number; pixels: number }>()
  private readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D
  private frame = 0
  private pixels = 0
  private static readonly MaxEntries = 768
  private static readonly MaxPixels = 192 * 1024 * 1024
  private static readonly MaxDimension = 1024

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    const context = this.canvas.getContext('2d', { alpha: true })
    if (!context) throw new Error('Canvas 2D is unavailable for text rasterization')
    this.ctx = context
  }

  beginFrame(): void {
    this.frame++
    if (this.frame % 40 !== 0) return
    for (const [key, entry] of this.entries) {
      if (this.frame - entry.lastUsed > 180) this.remove(key, entry)
    }
  }

  get(style: TextStyle): TextDraw {
    let rasterScale = clamp(style.rasterScale ?? Math.min(1.5, 2048 / Math.max(64, style.fontSize * 3)), 0.6, 2)
    const estimatedWidth = (style.text.length * style.fontSize + 40) * rasterScale
    const estimatedHeight = style.fontSize * 1.4 * rasterScale + 40
    const fit = Math.min(1, TextTextureCache.MaxDimension / Math.max(1, estimatedWidth, estimatedHeight))
    rasterScale *= fit
    const fill = style.fill ?? true
    const key = [
      style.text,
      style.fontSize.toFixed(2),
      style.weight,
      colorKey(style.color),
      style.glowColor ? colorKey(style.glowColor) : '-',
      (style.glowSigma ?? 0).toFixed(2),
      (style.strokeWidth ?? 0).toFixed(2),
      fill ? 'f' : 's',
      rasterScale.toFixed(2),
    ].join('|')
    const existing = this.entries.get(key)
    if (existing) {
      existing.lastUsed = this.frame
      return existing
    }
    const entry = this.rasterize(style, rasterScale, fill)
    this.entries.set(key, { ...entry, lastUsed: this.frame, pixels: entry.width * entry.height * 4 })
    this.pixels += entry.width * entry.height * 4
    this.evict()
    return this.entries.get(key)!
  }

  private rasterize(style: TextStyle, rasterScale: number, fill: boolean): TextDraw {
    const ctx = this.ctx
    const fontSize = Math.max(1, style.fontSize * rasterScale)
    const weight = style.weight >= 700 ? 700 : 400
    const font = `${weight} ${fontSize}px ${LYRIC_FONT_FAMILY}`
    ctx.font = font
    const metrics = ctx.measureText(style.text || ' ')
    const glowPad = style.glowColor
      ? Math.ceil(Math.min(64, Math.max(8, (style.glowSigma ?? 8) * rasterScale * 2.6 + 6)))
      : 0
    const strokePad = style.strokeWidth ? Math.ceil(style.strokeWidth * rasterScale * 2 + 4) : 0
    const pad = Math.max(8, glowPad, strokePad)
    const width = Math.max(1, Math.ceil(metrics.width) + pad * 2)
    const height = Math.max(1, Math.ceil(fontSize * 1.32) + pad * 2)
    this.canvas.width = width
    this.canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const x = width / 2
    const y = height / 2
    const color = `rgba(${Math.round(style.color.r * 255)},${Math.round(style.color.g * 255)},${Math.round(style.color.b * 255)},${style.color.a})`

    if (style.glowColor) {
      const glow = style.glowColor
      ctx.shadowColor = `rgba(${Math.round(glow.r * 255)},${Math.round(glow.g * 255)},${Math.round(glow.b * 255)},${glow.a})`
      ctx.shadowBlur = (style.glowSigma ?? 8) * rasterScale * 1.6
      ctx.fillStyle = color
      ctx.fillText(style.text, x, y)
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
    }

    if (fill) {
      ctx.fillStyle = color
      ctx.fillText(style.text, x, y)
    }
    if (style.strokeWidth && style.strokeWidth > 0) {
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(1, style.strokeWidth * rasterScale)
      ctx.lineJoin = 'round'
      ctx.strokeText(style.text, x, y)
    }

    const texture = this.gl.createTexture()
    if (!texture) throw new Error('Unable to allocate a text texture')
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false)
    this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.canvas)
    this.gl.generateMipmap(this.gl.TEXTURE_2D)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)

    return {
      texture,
      width: width / rasterScale,
      height: height / rasterScale,
      fontSize: style.fontSize,
    }
  }

  private evict(): void {
    while ((this.entries.size > TextTextureCache.MaxEntries || this.pixels > TextTextureCache.MaxPixels) && this.entries.size > 1) {
      let oldestKey = ''
      let oldest = Infinity
      for (const [key, entry] of this.entries) {
        if (entry.lastUsed < oldest) {
          oldest = entry.lastUsed
          oldestKey = key
        }
      }
      if (!oldestKey) return
      const entry = this.entries.get(oldestKey)
      if (!entry) return
      this.remove(oldestKey, entry)
    }
  }

  private remove(key: string, entry: TextDraw & { pixels: number }): void {
    this.gl.deleteTexture(entry.texture)
    this.entries.delete(key)
    this.pixels -= entry.pixels
  }

  dispose(): void {
    for (const [key, entry] of this.entries) this.remove(key, entry)
  }
}
