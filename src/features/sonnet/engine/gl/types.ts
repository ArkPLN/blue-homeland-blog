import type { Vec2 } from '../math'

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export const rgba = (r: number, g: number, b: number, a = 1): Color => ({ r, g, b, a })
export const withAlpha = (color: Color, alpha: number): Color => ({ ...color, a: color.a * alpha })

export type BlendMode = 'alpha' | 'screen'

export type SolidPrimitive =
  | {
      kind: 'stroke'
      points: Vec2[]
      width: number
      color: Color
      closed?: boolean
      dash?: number
      gap?: number
    }
  | { kind: 'poly'; points: Vec2[]; color: Color }
  | {
      kind: 'circle'
      cx: number
      cy: number
      radius: number
      color: Color
      fill?: boolean
      width?: number
      segments?: number
    }

export interface TextStyle {
  text: string
  fontSize: number
  weight: number
  color: Color
  glowColor?: Color
  glowSigma?: number
  strokeWidth?: number
  fill?: boolean
  rasterScale?: number
}

export interface TextDraw {
  texture: WebGLTexture
  width: number
  height: number
  fontSize: number
}

export interface FrameTuning {
  msaa: number
  chromaticSplit: boolean
  postProcess: boolean
  lensDistortion: number
  lensDispersion: number
  grain: number
  contrast: number
  rgbSplit: number
  halftone: number
  vignette: number
}
