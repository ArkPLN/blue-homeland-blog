import type { Color } from '../gl/types'

export type SonnetLanguage = 'auto' | 'chinese' | 'japanese' | 'english'
export type LexicalKind =
  | 'other'
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'function'
  | 'negation'
  | 'whitespace'
  | 'punctuation'
  | 'symbol'

export type ShotKind =
  | 'editorial'
  | 'impact'
  | 'collage'
  | 'ribbon'
  | 'mask'
  | 'poster'
  | 'quiet'

export type ParagraphKind = 'breath' | 'verse' | 'lift' | 'chorus' | 'break' | 'outro'
export type ParagraphBoundary = 'song-start' | 'time-gap' | 'metadata' | 'duration-cap' | 'line-cap'
export type TransitionKind = 'fast-blur' | 'mono-glitch' | 'camera-pull'
export type SegmentRole = 'hero' | 'semi-hero' | 'support' | 'decoration'
export type AnimationIntensity = 'calm' | 'normal' | 'chaotic'

export interface WordTiming {
  text: string
  start: number
  end: number
}

export interface LyricLine {
  text: string
  start: number
  end: number
  words: WordTiming[]
  /** True per-character timing derived from audio onsets; overrides word-level distribution. */
  graphemeTimings?: GraphemeTiming[]
  songPart?: string
  blockIndex?: number
  isChorus?: boolean
  renderEnd?: number
  language?: SonnetLanguage
}

export interface LexicalWord {
  text: string
  startOffset: number
  endOffset: number
  kind: LexicalKind
  attachment: 'none' | 'previous' | 'next'
}

export interface Emphasis {
  priority: number
  reliableDurationPerGrapheme: number
  occurrences: number
}

export interface GraphemeTiming {
  text: string
  start: number
  end: number
  wordIndex?: number
  isEstimated: boolean
  hasReliableStart: boolean
  hasReliableEnd: boolean
}

export interface SemanticSegment {
  text: string
  startOffset: number
  endOffset: number
  startTime: number
  endTime: number
  wordIndices: number[]
  graphemes: GraphemeTiming[]
  isWordLike: boolean
  lexicalWords: LexicalWord[]
  coreStartOffset?: number
  coreEndOffset?: number
  emphasis: Emphasis
}

export interface CompiledLine {
  sourceIndex: number
  line: LyricLine
  renderEndTime: number
  segments: SemanticSegment[]
}

export interface AnimationCue {
  at: number
  duration: number
  kind: string
  segmentStart: number
  segmentEnd: number
}

export interface CameraFrame {
  x: number
  y: number
  zoom: number
  rotation: number
}

export interface Shot {
  id: string
  kind: ShotKind
  startTime: number
  endTime: number
  lineIndices: number[]
  cues: AnimationCue[]
  camera: CameraFrame
}

export interface Transition {
  kind: TransitionKind
  startTime: number
  endTime: number
}

export interface Paragraph {
  id: string
  kind: ParagraphKind
  boundary: ParagraphBoundary
  startTime: number
  endTime: number
  lines: CompiledLine[]
  shots: Shot[]
  transitionOut: Transition | null
}

export interface Program {
  seed: string
  paragraphGapThreshold: number
  paragraphs: Paragraph[]
}

export interface Theme {
  background: Color
  primary: Color
  accent: Color
  secondary: Color
  fontFamily: string
  fontWeight: number
  animationIntensity: AnimationIntensity
  name: string
  description: string
}

export interface Tuning {
  cameraIntensity: number
  typographyMotion: number
  mgDensity: number
  showGuide: boolean
  showBackgroundMg: boolean
  showFixedGeometry: boolean
  showGiantDecorativeText: boolean
  showBackgroundDecor: boolean
  chromaticSplit: boolean
  enableTransitions: boolean
  enableGlitchTransitions: boolean
  textureResolution: number
  multisampleCount: number
  postProcess: boolean
  postProcessGrain: number
  postProcessContrast: number
  postProcessRgbShift: number
  postProcessHalftone: number
  postProcessVignette: number
  postProcessLensDistortion: number
  postProcessLensDispersion: number
}

export type PresetName = 'showcase' | 'player'

export interface AudioFrame {
  power: number
  bass: number
  vocal: number
}
