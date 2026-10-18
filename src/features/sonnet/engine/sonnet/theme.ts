import { rgba } from '../gl/types'
import type { FrameTuning } from '../gl/types'
import type { PresetName, Theme, Tuning } from './types'

export const midnightTheme: Theme = {
  background: rgba(0.051, 0.071, 0.208, 1),
  primary: rgba(1, 1, 1, 1),
  accent: rgba(0.55, 0.59, 0.72, 1),
  secondary: rgba(0.42, 0.45, 0.57, 1),
  fontFamily: '"Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif',
  fontWeight: 600,
  animationIntensity: 'normal',
  name: 'Midnight Dream',
  description: 'SONNET / FOLIA v0.7.2',
}

export const showcaseTuning: Tuning = {
  cameraIntensity: 1,
  typographyMotion: 1,
  mgDensity: 1,
  showGuide: true,
  showBackgroundMg: true,
  showFixedGeometry: true,
  showGiantDecorativeText: true,
  showBackgroundDecor: true,
  chromaticSplit: true,
  enableTransitions: true,
  enableGlitchTransitions: true,
  textureResolution: 1.5,
  multisampleCount: 4,
  postProcess: false,
  postProcessGrain: 0,
  postProcessContrast: 0,
  postProcessRgbShift: 0,
  postProcessHalftone: 0,
  postProcessVignette: 0,
  postProcessLensDistortion: 0,
  postProcessLensDispersion: 0,
}

export const playerTuning: Tuning = {
  ...showcaseTuning,
  chromaticSplit: false,
  postProcess: true,
  postProcessLensDistortion: 0.3,
  postProcessLensDispersion: 0,
  postProcessGrain: 0,
  postProcessVignette: 0,
  postProcessRgbShift: 0,
  postProcessHalftone: 0,
  postProcessContrast: 0,
}

export function tuningForPreset(preset: PresetName): Tuning {
  return preset === 'player' ? { ...playerTuning } : { ...showcaseTuning }
}

export function frameTuningFrom(tuning: Tuning, preset: PresetName): FrameTuning {
  return {
    msaa: tuning.multisampleCount,
    chromaticSplit: tuning.chromaticSplit,
    postProcess: tuning.postProcess,
    lensDistortion: tuning.postProcessLensDistortion,
    lensDispersion: tuning.postProcessLensDispersion,
    grain: tuning.postProcessGrain,
    contrast: tuning.postProcessContrast,
    rgbSplit: tuning.postProcessRgbShift,
    halftone: tuning.postProcessHalftone,
    vignette: tuning.postProcessVignette,
  }
}

