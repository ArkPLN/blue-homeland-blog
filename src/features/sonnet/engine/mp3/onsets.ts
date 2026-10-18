/**
 * Audio onset detection for per-character lyric alignment.
 * Decodes the MP3 with WebAudio, then finds energy-attack peaks in the vocal band.
 */

export function mixToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels
  if (channels === 1) return buffer.getChannelData(0).slice()
  const output = new Float32Array(buffer.length)
  for (let channel = 0; channel < channels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < data.length; index++) output[index] += data[index] / channels
  }
  return output
}

/**
 * Energy-flux onset detector. Works on mono PCM and returns onset times in seconds.
 * Deterministic for a given signal, which keeps repeated seeks visually stable.
 */
export function detectOnsets(samples: Float32Array, sampleRate: number): number[] {
  const hop = Math.max(1, Math.round(sampleRate * 0.01))
  const frames = Math.floor(samples.length / hop)
  if (frames < 8) return []

  const rms = new Float32Array(frames)
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0
    const offset = frame * hop
    for (let index = 0; index < hop; index++) {
      const value = samples[offset + index]
      sum += value * value
    }
    rms[frame] = Math.sqrt(sum / hop)
  }

  const smooth = new Float32Array(frames)
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0
    let count = 0
    for (let delta = -2; delta <= 2; delta++) {
      const index = frame + delta
      if (index < 0 || index >= frames) continue
      sum += rms[index]
      count++
    }
    smooth[frame] = sum / count
  }

  const flux = new Float32Array(frames)
  for (let frame = 1; frame < frames; frame++) flux[frame] = Math.max(0, smooth[frame] - smooth[frame - 1])

  const window = Math.round(0.5 / (hop / sampleRate))
  const minimumGap = 0.1
  const onsets: number[] = []
  let last = Number.NEGATIVE_INFINITY
  for (let frame = 2; frame < frames - 1; frame++) {
    if (flux[frame] <= 0.0008) continue
    if (flux[frame] < flux[frame - 1] || flux[frame] <= flux[frame + 1]) continue
    let sum = 0
    let count = 0
    for (let delta = -window; delta <= window; delta++) {
      const index = frame + delta
      if (index < 0 || index >= frames) continue
      sum += flux[index]
      count++
    }
    const threshold = (sum / Math.max(1, count)) * 1.75 + 0.0006
    if (flux[frame] < threshold) continue
    const time = (frame * hop) / sampleRate
    if (time - last < minimumGap) continue
    onsets.push(Math.round(time * 1000) / 1000)
    last = time
  }
  return onsets
}

async function decode(buffer: ArrayBuffer): Promise<AudioBuffer | null> {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  const context = new Ctor()
  try {
    return await context.decodeAudioData(buffer.slice(0))
  } catch {
    return null
  } finally {
    void context.close().catch(() => {})
  }
}

/**
 * Isolate the vocal band (roughly 220 Hz – 4 kHz) with WebAudio biquads so
 * kick/snare attacks do not dominate onset selection.
 */
async function vocalBand(decoded: AudioBuffer): Promise<Float32Array | null> {
  const OfflineCtor = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
  if (!OfflineCtor) return null
  const rate = decoded.sampleRate
  try {
    const offline = new OfflineCtor(1, Math.max(1, decoded.length), rate)
    const source = offline.createBufferSource()
    source.buffer = decoded
    const highpass = offline.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 220
    highpass.Q.value = 0.7
    const lowpass = offline.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 4000
    lowpass.Q.value = 0.7
    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(offline.destination)
    source.start(0)
    const rendered = await offline.startRendering()
    return rendered.getChannelData(0).slice()
  } catch {
    return null
  }
}

/** Decode an MP3/audio buffer and return detected vocal onset times (seconds). */
export async function analyzeOnsets(buffer: ArrayBuffer): Promise<number[]> {
  const decoded = await decode(buffer)
  if (!decoded) return []
  const filtered = await vocalBand(decoded)
  return detectOnsets(filtered ?? mixToMono(decoded), decoded.sampleRate)
}
