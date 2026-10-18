import { parseBlob } from 'music-metadata'
import { buildTrackFromMetadata } from './engine/mp3/lyrics'
import { analyzeOnsets } from './engine/mp3/onsets'
import { compileProgram } from './engine/sonnet/program-compiler'
import { SonnetScene } from './engine/sonnet/scene'
import type { AnimationIntensity, LyricLine, PresetName, Program } from './engine/sonnet/types'
import { frameTuningFrom, midnightTheme, tuningForPreset } from './engine/sonnet/theme'
import { Renderer } from './engine/gl/renderer'
import { AudioEngine } from './engine/player/audio'
import { formatClock, renderApp } from './markup'
import { FULL_NOTICE, MIT_LICENSE, copyText } from './license'
import type { CopyTarget } from './license'
import { DEFAULT_TRACK_MIME, DEFAULT_TRACK_NAME, DEFAULT_TRACK_PATH, assertMp3 } from './default-track'

renderApp()

const sonnetRoot = document.querySelector<HTMLElement>('.sonnet-root')!

const canvas = document.querySelector<HTMLCanvasElement>('#sonnet-canvas')!
const stageFrame = document.querySelector<HTMLElement>('.stage-frame')!
const stageCover = document.querySelector<HTMLElement>('#stage-cover')!
const stageError = document.querySelector<HTMLElement>('#stage-error')!
const stageLoading = document.querySelector<HTMLElement>('#stage-loading')!
const stageStatus = document.querySelector<HTMLElement>('#stage-status')!
const debugHud = document.querySelector<HTMLElement>('#debug-hud')!
const playButton = document.querySelector<HTMLButtonElement>('#play')!
const replayButton = document.querySelector<HTMLButtonElement>('#replay')!
const progress = document.querySelector<HTMLInputElement>('#progress')!
const progressFill = document.querySelector<HTMLElement>('#progress-fill')!
const progressThumb = document.querySelector<HTMLElement>('#progress-thumb')!
const progressMarkers = document.querySelector<HTMLElement>('#progress-markers')!
const currentTimeLabel = document.querySelector<HTMLElement>('#current-time')!
const totalTimeLabel = document.querySelector<HTMLElement>('#total-time')!
const lyricLive = document.querySelector<HTMLElement>('#lyric-live')!
const lyricTranscript = document.querySelector<HTMLElement>('#lyric-transcript')!
const trackTitle = document.querySelector<HTMLElement>('#track-title')!
const trackMeta = document.querySelector<HTMLElement>('#track-meta')!
const trackCover = document.querySelector<HTMLElement>('#track-cover')!
const coverImage = document.querySelector<HTMLImageElement>('#cover-image')!
const audioStatus = document.querySelector<HTMLElement>('#audio-status')!
const audioNote = document.querySelector<HTMLElement>('#audio-note')!
const settingsToggle = document.querySelector<HTMLButtonElement>('#settings-toggle')!
const settingsPanel = document.querySelector<HTMLElement>('#settings-panel')!
const settingsClose = document.querySelector<HTMLButtonElement>('#settings-close')!
const seedInput = document.querySelector<HTMLInputElement>('#seed-input')!
const seedApply = document.querySelector<HTMLButtonElement>('#seed-apply')!
const seedRandom = document.querySelector<HTMLButtonElement>('#seed-random')!
const audioFile = document.querySelector<HTMLInputElement>('#audio-file')!
const lyricFile = document.querySelector<HTMLInputElement>('#lyric-file')!
const debugToggle = document.querySelector<HTMLInputElement>('#debug-toggle')!
const reducedToggle = document.querySelector<HTMLInputElement>('#reduced-toggle')!

function showStageError(message: string): void {
  stageError.hidden = false
  stageError.textContent = `${message}\n\n点击此处重试内置 MP3`
  stageError.style.cursor = 'pointer'
}

function setLoading(active: boolean, message = '正在读取 MP3 与 ID3 歌词…'): void {
  stageLoading.hidden = !active
  if (active) stageLoading.querySelector('p')!.textContent = message
  if (active) stageStatus.textContent = 'LOADING / ID3'
}

window.addEventListener('error', (event) => showStageError(`运行错误：${event.message}`))
window.addEventListener('unhandledrejection', (event) => showStageError(`未处理的异常：${String(event.reason)}`))

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let preset: PresetName = 'showcase'
let tuning = tuningForPreset(preset)
let theme = { ...midnightTheme, animationIntensity: reducedMotion.matches ? 'calm' as AnimationIntensity : 'normal' as AnimationIntensity }
let program: Program = compileProgram([], 'loading')
let trackLines: LyricLine[] = []
let metadata = { title: '正在读取 MP3…', artist: 'ID3 / MP3', album: '' }
let duration = 0
let currentTime = 0
let playing = false
let ended = false
let loading = true
let trackLoaded = false
let seed = ''
let coverUrl: string | null = null
let dirty = true
let lastLyric = ''
let debugVisible = false
let frameCount = 0
let fpsAnchor = performance.now()
let fps = 0
let lastUiUpdate = 0
let lastAudioFrame = { power: 0, bass: 0, vocal: 0 }
let currentFile: File | null = null
let currentOnsets: number[] = []
let importedLrc: string | undefined

let renderer: Renderer
try {
  renderer = new Renderer(canvas)
} catch (error) {
  setLoading(false)
  showStageError(`无法初始化 WebGL2：${error instanceof Error ? error.message : String(error)}`)
  throw error
}
let scene = new SonnetScene(program, theme, tuning, metadata, canvas.clientWidth || 960, canvas.clientHeight || 540)
const audio = new AudioEngine()

;(window as unknown as { __sonnet: unknown }).__sonnet = {
  audio,
  get scene() { return scene },
  get program() { return program },
  get duration() { return duration },
  get currentTime() { return currentTime },
  get seed() { return seed },
  get lines() { return trackLines },
  compile: (value: string) => compileProgram(trackLines, value),
  seek: (time: number) => seekTo(time),
  play: () => togglePlayback(),
  preset: (name: PresetName) => setPreset(name),
  intensity: (name: AnimationIntensity) => setIntensity(name),
  setSeed: (value: string) => setSeed(value),
  loadDefault: () => loadDefaultTrack(),
  importLrc: (text: string) => applyLrcText(text),
}

function renderScene(time: number): void {
  lastAudioFrame = audio.frame(time)
  scene.setAudio(lastAudioFrame)
  scene.update(time)
  renderer.beginFrame()
  scene.draw({ renderer, time })
  renderer.endFrame(frameTuningFrom(tuning, preset), scene.blur, scene.glitch, scene.glitchSeed)
  frameCount++
}

function resize(): void {
  const width = Math.max(1, canvas.clientWidth)
  const height = Math.max(1, canvas.clientHeight)
  renderer.resize(width, height, window.devicePixelRatio || 1)
  scene.resize(width, height)
  dirty = true
  renderScene(currentTime)
  updateUi(currentTime, true)
}

function setTrackControls(enabled: boolean): void {
  playButton.disabled = !enabled
  replayButton.disabled = !enabled
  progress.disabled = !enabled
  seedInput.disabled = !enabled || trackLines.length < 2
  seedApply.disabled = !enabled || trackLines.length < 2
  seedRandom.disabled = !enabled || trackLines.length < 2
}

function updatePlayState(): void {
  playButton.setAttribute('aria-pressed', String(playing))
  playButton.setAttribute('aria-label', playing ? '暂停' : '播放')
  sonnetRoot.classList.toggle('is-playing', playing)
  stageStatus.textContent = loading ? 'LOADING / ID3' : ended ? 'END OF TRACK' : playing ? 'PLAYING / LIVE' : 'PAUSED / READY'
}

function updateUi(time: number, force = false): void {
  const ratio = duration > 0 ? Math.max(0, Math.min(1, time / duration)) : 0
  currentTimeLabel.textContent = formatClock(time)
  totalTimeLabel.textContent = duration > 0 ? formatClock(duration) : '--:--'
  progress.value = String(time)
  progress.setAttribute('aria-valuetext', `${formatClock(time)} / ${formatClock(duration)}`)
  progressFill.style.transform = `scaleX(${ratio})`
  progressThumb.style.left = `${ratio * 100}%`
  const activeLine = [...trackLines].reverse().find((line) => time >= line.start)
  const lyric = activeLine && time <= activeLine.end + 1.2 ? activeLine.text : ''
  if (lyric !== lastLyric) {
    lastLyric = lyric
    lyricLive.textContent = lyric || (trackLines.length === 0 ? (loading ? '正在读取歌词' : '纯音乐 / 乐谱模式') : '')
  }
  if (debugVisible) {
    const elapsed = performance.now() - fpsAnchor
    if (elapsed > 500) {
      fps = (frameCount * 1000) / elapsed
      frameCount = 0
      fpsAnchor = performance.now()
    }
    const stats = renderer.stats
    debugHud.innerHTML = `<strong>${scene.debugParagraph} · ${scene.debugShot}</strong>
<span>${scene.debugMg}</span>
<span>${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s · ${trackLines.length} lyric lines</span>
<span>${fps.toFixed(1)} fps · ${stats.cpuMs.toFixed(1)} ms cpu · ${stats.drawCalls} draws · ${Math.round(stats.triangles)} tris</span>
<span>blur ${scene.blur.toFixed(2)} · glitch ${scene.glitch.toFixed(2)} · CA ${tuning.chromaticSplit ? 'on' : 'off'} · post ${tuning.postProcess ? 'on' : 'off'}</span>
<span>audio ${lastAudioFrame.power.toFixed(2)} / ${lastAudioFrame.bass.toFixed(2)} / ${lastAudioFrame.vocal.toFixed(2)} · ${audioStatus.textContent}</span>`
  }
  if (force) updatePlayState()
}

function refreshMarkers(): void {
  if (duration <= 0) {
    progressMarkers.innerHTML = ''
    return
  }
  progressMarkers.innerHTML = program.paragraphs
    .slice(1)
    .map((paragraph) => `<i style="left:${Math.min(100, (paragraph.startTime / duration) * 100)}%"></i>`)
    .join('')
}

function syncPresetButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.preset === preset))
  })
}

function syncIntensityButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-intensity]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.intensity === theme.animationIntensity))
  })
  reducedToggle.checked = theme.animationIntensity === 'calm'
}

function rebuildScene(): void {
  scene = new SonnetScene(program, theme, tuning, metadata, canvas.clientWidth || 960, canvas.clientHeight || 540)
  scene.resize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight))
  audio.seek(currentTime)
  refreshMarkers()
  dirty = true
  renderScene(currentTime)
  updateUi(currentTime, true)
}

function setPreset(next: PresetName): void {
  preset = next
  tuning = tuningForPreset(preset)
  syncPresetButtons()
  rebuildScene()
}

function setIntensity(next: AnimationIntensity): void {
  theme = { ...theme, animationIntensity: next }
  syncIntensityButtons()
  rebuildScene()
}

function setSeed(next: string): void {
  if (!trackLoaded || trackLines.length < 2) return
  seed = next.trim() || seed
  seedInput.value = seed
  program = compileProgram(trackLines, seed)
  audio.seek(currentTime)
  rebuildScene()
}

async function togglePlayback(): Promise<void> {
  if (!trackLoaded) return
  if (playing) {
    await audio.setPlaying(false)
    playing = false
    updatePlayState()
    dirty = true
    return
  }
  if (ended || currentTime >= duration - 0.05) {
    ended = false
    currentTime = 0
    audio.seek(0)
  }
  const started = await audio.setPlaying(true)
  if (!started) {
    audioNote.textContent = '浏览器阻止了播放（需要一次用户手势）。请再次点击播放按钮。'
    updatePlayState()
    return
  }
  playing = true
  updatePlayState()
  dirty = true
}

function seekTo(time: number): void {
  if (!trackLoaded) return
  const next = Math.max(0, Math.min(duration, time))
  currentTime = next
  audio.seek(next)
  ended = next >= duration - 0.02
  if (ended) {
    void audio.setPlaying(false)
    playing = false
  }
  updatePlayState()
  dirty = true
  renderScene(next)
  updateUi(next, true)
}

async function replay(): Promise<void> {
  if (!trackLoaded) return
  currentTime = 0
  ended = false
  audio.seek(0)
  if (!playing) {
    const started = await audio.setPlaying(true)
    playing = started
  }
  updatePlayState()
  dirty = true
  renderScene(0)
  updateUi(0, true)
}

function applyTrack(built: ReturnType<typeof buildTrackFromMetadata>): void {
  program = built.program
  trackLines = built.lines
  metadata = { title: built.title, artist: built.artist, album: built.album }
  duration = built.duration > 0 ? built.duration : audio.duration
  seed = built.seed
  currentTime = Math.min(built.previewTime, Math.max(0, duration - 1))
  ended = false
  playing = false
  loading = false
  trackLoaded = true
  audio.seek(currentTime)

  trackTitle.textContent = built.title
  trackMeta.textContent = built.album ? `${built.artist} — ${built.album}` : built.artist
  audioStatus.textContent = `${built.source}${built.lines.length > 0 ? ` · ${built.lines.length} LINES · ${built.aligned} ONSET-ALIGNED` : ''}`
  audioNote.textContent = built.lines.length > 0
    ? `已读取 ${built.lines.length} 行歌词（${built.source}）。${built.aligned} 行按音频起音对齐到逐字；其余行按词长分配。`
    : 'MP3 中没有可用的歌词标签，使用五线谱模式。'
  lyricTranscript.textContent = built.lines.map((line) => line.text).join('\n')
  seedInput.value = built.seed
  totalTimeLabel.textContent = formatClock(duration)
  progress.max = String(Math.max(0.01, duration))
  document.title = `${built.title} — Sonnet · 蔚蓝之家`
  coverImage.alt = built.title

  if (coverUrl) URL.revokeObjectURL(coverUrl)
  coverUrl = null
  if (built.cover) {
    const bytes = new Uint8Array(built.cover.data)
    coverUrl = URL.createObjectURL(new Blob([bytes.buffer], { type: built.cover.format || 'image/jpeg' }))
    coverImage.src = coverUrl
    coverImage.hidden = false
    trackCover.classList.add('has-image')
    stageCover.style.backgroundImage = `url("${coverUrl}")`
  } else {
    coverImage.hidden = true
    coverImage.removeAttribute('src')
    trackCover.classList.remove('has-image')
    stageCover.style.backgroundImage = ''
  }

  scene = new SonnetScene(program, theme, tuning, metadata, canvas.clientWidth || 960, canvas.clientHeight || 540)
  scene.resize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight))
  refreshMarkers()
  setLoading(false)
  setTrackControls(true)
  updatePlayState()
  renderScene(currentTime)
  updateUi(currentTime, true)
}

async function loadTrack(file: File, label: string, lrc?: string): Promise<void> {
  setLoading(true, `正在解析 ${label}…`)
  stageError.hidden = true
  try {
    // Read the bytes once: both the tag parser and the decoder need them, and a
    // File read also avoids any network/range requests for the default track.
    const bytes = await file.arrayBuffer()
    assertMp3(bytes)
    const parsed = await parseBlob(file, { duration: true })
    setLoading(true, '正在分析音频起音，对齐逐字时间…')
    const onsets = await analyzeOnsets(bytes)
    const built = buildTrackFromMetadata(parsed, parsed.format.duration ?? 0, onsets, lrc)
    currentFile = file
    currentOnsets = onsets
    importedLrc = lrc
    await audio.load(file, bytes)
    applyTrack(built)
  } catch (error) {
    loading = false
    setLoading(false)
    updatePlayState()
    showStageError(`无法读取 MP3 / 歌词：${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Rebuild the program for the current audio using imported LRC or plain lyrics. */
async function applyLrcText(text: string): Promise<void> {
  if (!currentFile) {
    showStageError('请先导入或加载一首 MP3，再导入歌词文件。')
    return
  }
  setLoading(true, '正在按导入歌词重建节目单…')
  try {
    const parsed = await parseBlob(currentFile, { duration: true })
    const built = buildTrackFromMetadata(parsed, parsed.format.duration ?? 0, currentOnsets, text)
    importedLrc = text
    applyTrack(built)
  } catch (error) {
    loading = false
    setLoading(false)
    updatePlayState()
    showStageError(`无法读取歌词文件：${error instanceof Error ? error.message : String(error)}`)
  }
}

async function applyLyricFile(file: File): Promise<void> {
  await applyLrcText(await file.text())
}

async function fetchAudioBytes(url: string): Promise<{ buffer: ArrayBuffer; type: string }> {
  let lastError: unknown
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      // Some embedded browsers fail while streaming a large Blob response;
      // buffering explicitly is reliable and this is a local demo asset.
      const buffer = await response.arrayBuffer()
      assertMp3(buffer)
      return { buffer, type: response.headers.get('content-type') ?? DEFAULT_TRACK_MIME }
    } catch (error) {
      lastError = error
      setLoading(true, `正在读取内置 MP3…（第 ${attempt + 1} 次）`)
      await new Promise((resolve) => window.setTimeout(resolve, 1400))
    }
  }
  throw lastError
}

async function loadDefaultTrack(): Promise<void> {
  stageError.hidden = true
  try {
    const { buffer } = await fetchAudioBytes(DEFAULT_TRACK_PATH)
    // The endpoint answers with `application/octet-stream` so download managers
    // leave it alone; give the File a real audio type for the tag parser.
    const file = new File([buffer], DEFAULT_TRACK_NAME, { type: DEFAULT_TRACK_MIME })
    await loadTrack(file, '内置 MP3')
  } catch (error) {
    loading = false
    setLoading(false)
    updatePlayState()
    showStageError(`无法读取内置 MP3：${error instanceof Error ? error.message : String(error)}`)
  }
}

playButton.addEventListener('click', () => { void togglePlayback() })
replayButton.addEventListener('click', () => { void replay() })
progress.addEventListener('input', () => seekTo(Number(progress.value)))
settingsToggle.addEventListener('click', () => {
  const open = settingsPanel.hidden
  settingsPanel.hidden = !open
  settingsToggle.setAttribute('aria-expanded', String(open))
})
settingsClose.addEventListener('click', () => {
  settingsPanel.hidden = true
  settingsToggle.setAttribute('aria-expanded', 'false')
})
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => setPreset(button.dataset.preset as PresetName))
})
document.querySelectorAll<HTMLButtonElement>('[data-intensity]').forEach((button) => {
  button.addEventListener('click', () => setIntensity(button.dataset.intensity as AnimationIntensity))
})
seedApply.addEventListener('click', () => setSeed(seedInput.value))
seedInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') setSeed(seedInput.value)
})
seedRandom.addEventListener('click', () => setSeed(`seed-${Date.now().toString(36)}`))
audioFile.addEventListener('change', async () => {
  const file = audioFile.files?.[0]
  if (!file) return
  await loadTrack(file, file.name)
  audioFile.value = ''
})
lyricFile.addEventListener('change', async () => {
  const file = lyricFile.files?.[0]
  if (!file) return
  await applyLyricFile(file)
  lyricFile.value = ''
})
debugToggle.addEventListener('change', () => {
  debugVisible = debugToggle.checked
  debugHud.hidden = !debugVisible
  updateUi(currentTime, true)
})
reducedToggle.addEventListener('change', () => setIntensity(reducedToggle.checked ? 'calm' : 'normal'))
reducedMotion.addEventListener('change', (event) => setIntensity(event.matches ? 'calm' : 'normal'))

const copyStatus = document.querySelector<HTMLElement>('#copy-status')!
const copyStatusDefault = copyStatus.textContent ?? ''
let copyStatusTimer = 0
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = button.dataset.copy as CopyTarget
    const ok = await copyText(target === 'mit' ? MIT_LICENSE : FULL_NOTICE)
    if (!ok) {
      copyStatus.textContent = '复制失败：浏览器拒绝了剪贴板访问，请手动选择文本复制。'
    } else if (target === 'mit') {
      copyStatus.textContent = '已复制 MIT 许可证到剪贴板。'
    } else {
      copyStatus.textContent = '已复制完整许可与第三方声明到剪贴板。'
    }
    window.clearTimeout(copyStatusTimer)
    copyStatusTimer = window.setTimeout(() => {
      copyStatus.textContent = copyStatusDefault
    }, 4200)
  })
})

document.addEventListener('keydown', (event) => {
  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return
  if (event.key === ' ' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()
    void togglePlayback()
  } else if ((event.key === 'd' || event.key === 'D') && !event.metaKey && !event.ctrlKey) {
    debugVisible = !debugVisible
    debugToggle.checked = debugVisible
    debugHud.hidden = !debugVisible
    updateUi(currentTime, true)
  }
})

stageError.addEventListener('click', () => {
  if (stageError.hidden) return
  stageError.hidden = true
  void loadDefaultTrack()
})
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault()
  showStageError('WebGL 上下文丢失，正在等待恢复。')
})
canvas.addEventListener('webglcontextrestored', () => {
  stageError.hidden = true
  resize()
})

const observer = new ResizeObserver(() => resize())
observer.observe(stageFrame)
window.addEventListener('beforeunload', () => {
  observer.disconnect()
  audio.dispose()
  renderer.dispose()
  if (coverUrl) URL.revokeObjectURL(coverUrl)
})

syncPresetButtons()
syncIntensityButtons()
setTrackControls(false)
setLoading(true)
updatePlayState()
updateUi(0, true)
resize()
const bootDefault = (): void => {
  window.setTimeout(() => { void loadDefaultTrack() }, 250)
}
if (document.readyState === 'complete') bootDefault()
else window.addEventListener('load', bootDefault, { once: true })

function animate(now: number): void {
  if (trackLoaded) {
    currentTime = audio.currentTime
    if (playing && audio.paused && !audio.ended) {
      playing = false
      updatePlayState()
    }
    if (!audio.paused && !playing) {
      playing = true
      updatePlayState()
    }
    if (playing && audio.ended) {
      ended = true
      playing = false
      updatePlayState()
      stageStatus.textContent = 'END OF TRACK'
      dirty = true
    }
    if (playing || dirty) {
      renderScene(currentTime)
      dirty = false
    }
    if (now - lastUiUpdate > 100) {
      lastUiUpdate = now
      updateUi(currentTime)
    }
  }
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
