import type { AudioFrame } from '../sonnet/types'

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/**
 * Buffered WebAudio player.
 *
 * The previous implementation used an `<audio>` element fed by a Blob URL. Two
 * things broke in real Chrome installs:
 *  - download managers (IDM and similar) claim media requests based on the URL
 *    extension / `audio/*` content type, so the fetch never returned the bytes;
 *  - Chromium issues ranged requests against the blob URL and surfaced
 *    `net::ERR_REQUEST_RANGE_NOT_SATISFIABLE` when the blob was empty.
 *
 * Decoding the whole file once with `decodeAudioData` avoids both: playback is
 * driven by an `AudioBufferSourceNode`, so no element, no blob URL and no range
 * requests are involved.
 */
export class AudioEngine {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private buffer: AudioBuffer | null = null
  private bins: Uint8Array<ArrayBuffer> | null = null
  private smoothed = { power: 0, bass: 0, vocal: 0 }
  private lastTime = -1
  /** Position inside the buffer while paused. */
  private offset = 0
  /** `context.currentTime` captured when the current source started. */
  private startedAt = 0
  private playing = false
  private reachedEnd = false
  fileName: string | null = null
  failed = false

  get ready(): boolean {
    return this.buffer !== null
  }

  get currentTime(): number {
    if (!this.buffer) return 0
    if (!this.playing || !this.context) return this.offset
    const elapsed = this.context.currentTime - this.startedAt
    return Math.max(0, Math.min(this.buffer.duration, this.offset + elapsed))
  }

  get duration(): number {
    return this.buffer?.duration ?? 0
  }

  get paused(): boolean {
    return !this.playing
  }

  get ended(): boolean {
    return this.reachedEnd
  }

  async load(file: File, bytes?: ArrayBuffer): Promise<void> {
    this.disposeAudio()
    this.fileName = file.name
    try {
      const context = this.context ?? new AudioContext()
      this.context = context
      if (!this.analyser) {
        this.analyser = context.createAnalyser()
        this.analyser.fftSize = 2048
        this.analyser.smoothingTimeConstant = 0.72
        this.analyser.connect(context.destination)
        this.bins = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
      }
      const raw = bytes ?? (await file.arrayBuffer())
      if (raw.byteLength === 0) throw new Error('音频数据为空')
      // `decodeAudioData` detaches the buffer, so hand it a copy.
      this.buffer = await context.decodeAudioData(raw.slice(0))
    } catch (error) {
      this.buffer = null
      this.failed = true
      throw error
    }
  }

  async setPlaying(playing: boolean): Promise<boolean> {
    if (!playing) {
      this.pauseSource()
      return true
    }
    if (!this.buffer || !this.context) return false
    try {
      if (this.context.state === 'suspended') await this.context.resume()
      if (this.reachedEnd || this.offset >= this.buffer.duration - 0.02) {
        this.offset = 0
        this.reachedEnd = false
      }
      this.startSource(this.offset)
      return true
    } catch {
      this.failed = true
      return false
    }
  }

  seek(time: number): void {
    if (!this.buffer) return
    const next = Math.max(0, Math.min(this.buffer.duration - 0.02, time))
    this.offset = next
    this.reachedEnd = false
    if (this.playing) this.startSource(next)
  }

  frame(time: number): AudioFrame {
    if (!this.buffer) return this.simulated(time)
    if (!this.analyser || !this.bins || !this.playing) return { power: 0, bass: 0, vocal: 0 }
    this.analyser.getByteFrequencyData(this.bins)
    const length = this.bins.length
    const usable = Math.min(96, length)
    if (usable === 0) return this.simulated(time)
    const step = Math.max(1, Math.floor(length / usable))
    const values: number[] = []
    for (let index = 0; index < usable; index++) {
      let sum = 0
      let count = 0
      for (let inner = 0; inner < step; inner++) {
        const bin = index * step + inner
        if (bin >= length) break
        sum += this.bins[bin]
        count++
      }
      values.push(count > 0 ? sum / count / 255 : 0)
    }
    const bassEnd = Math.max(1, Math.floor(values.length / 3))
    const vocalStart = bassEnd
    const vocalEnd = Math.max(vocalStart + 1, Math.floor((values.length * 2) / 3))
    const power = values.reduce((sum, value) => sum + value, 0) / values.length
    const bass = values.slice(0, bassEnd).reduce((sum, value) => sum + value, 0) / bassEnd
    const vocal = values.slice(vocalStart, vocalEnd).reduce((sum, value) => sum + value, 0) / Math.max(1, vocalEnd - vocalStart)
    const delta = this.lastTime < 0 ? 1 : Math.max(0, Math.min(0.25, time - this.lastTime))
    this.lastTime = time
    const factorUp = 1 - Math.pow(1 - 0.34, delta * 60)
    const factorDown = 1 - Math.pow(1 - 0.16, delta * 60)
    this.smoothed.power += (power - this.smoothed.power) * (power > this.smoothed.power ? factorUp : factorDown)
    this.smoothed.bass += (bass - this.smoothed.bass) * (bass > this.smoothed.bass ? factorUp : factorDown)
    this.smoothed.vocal += (vocal - this.smoothed.vocal) * (vocal > this.smoothed.vocal ? factorUp : factorDown)
    return { ...this.smoothed }
  }

  simulated(time: number): AudioFrame {
    const pulse = (frequency: number, phase: number): number => (Math.sin(time * frequency + phase) + 1) / 2
    const phrase = clamp01((time % 9.4) / 9.4)
    const swell = Math.sin(Math.PI * phrase) * 0.35 + 0.35
    const bass = clamp01(0.18 + swell * 0.4 + pulse(3.1, 1.2) * 0.12)
    const vocal = clamp01(0.16 + swell * 0.52 + pulse(1.7, 0.4) * 0.16)
    const power = clamp01(0.22 + swell * 0.42 + pulse(0.9, 2.1) * 0.1)
    return { power, bass, vocal }
  }

  private startSource(offset: number): void {
    if (!this.context || !this.buffer || !this.analyser) return
    this.stopSource()
    const source = this.context.createBufferSource()
    source.buffer = this.buffer
    source.connect(this.analyser)
    source.onended = () => {
      // `onended` also fires for an explicit stop; only a natural end counts.
      if (this.source !== source) return
      this.source = null
      this.playing = false
      this.offset = this.buffer?.duration ?? 0
      this.reachedEnd = true
    }
    this.source = source
    this.offset = offset
    this.startedAt = this.context.currentTime
    this.playing = true
    this.reachedEnd = false
    source.start(0, offset)
  }

  private stopSource(): void {
    const source = this.source
    if (!source) return
    this.source = null
    source.onended = null
    try {
      source.stop()
    } catch {
      // Already stopped.
    }
    source.disconnect()
  }

  private pauseSource(): void {
    if (!this.playing) return
    this.offset = this.currentTime
    this.playing = false
    this.stopSource()
  }

  disposeAudio(): void {
    this.pauseSource()
    this.stopSource()
    this.buffer = null
    this.fileName = null
    this.lastTime = -1
    this.offset = 0
    this.startedAt = 0
    this.playing = false
    this.reachedEnd = false
    this.smoothed = { power: 0, bass: 0, vocal: 0 }
  }

  clear(): void {
    this.disposeAudio()
    this.failed = false
  }

  dispose(): void {
    this.disposeAudio()
    this.analyser?.disconnect()
    this.analyser = null
    this.bins = null
    this.context?.close().catch(() => {})
    this.context = null
  }
}
