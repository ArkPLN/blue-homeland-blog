import { AUDIO_NOTICE, MIT_LICENSE } from './license'

export function renderApp(): void {
  const app = document.querySelector<HTMLDivElement>('#sonnet-app')
  if (!app) throw new Error('Application root #sonnet-app was not found')
  app.innerHTML = `<main class="app-shell">
    <div class="latent latent--one" aria-hidden="true"></div>
    <div class="latent latent--two" aria-hidden="true"></div>
    <header class="masthead">
      <a class="wordmark" href="#top" aria-label="Sonnet 首页">
        <span class="wordmark__mark">S.</span>
        <span class="wordmark__name">SONNET<span> / FOLIA</span></span>
      </a>
      <div class="masthead__center">
        <span class="live-mark"><i></i> MIDNIGHT DREAM</span>
        <span class="masthead__rule"></span>
        <span>MP3 歌词视觉实验</span>
      </div>
      <div class="masthead__actions">
        <span class="audio-status" id="audio-status" role="status">READING ID3</span>
        <button class="ghost-button" id="settings-toggle" type="button" aria-expanded="false" aria-controls="settings-panel">设置</button>
      </div>
    </header>

    <section class="experience" id="top" aria-label="动态字幕实验">
      <div class="experience__meta">
        <div>
          <p class="eyebrow">KINETIC TYPOGRAPHY <span>—</span> FROM MP3 TO MOTION</p>
          <h1>让每一个字，<em>跟着这首歌发生。</em></h1>
        </div>
        <p class="experience__aside">歌词来自 MP3 内嵌 ID3<br>动画来自歌词与时间戳</p>
      </div>

      <div class="stage-frame">
        <div class="stage-cover" id="stage-cover" aria-hidden="true"></div>
        <canvas id="sonnet-canvas" aria-label="动态字幕舞台"></canvas>
        <div class="stage-vignette" aria-hidden="true"></div>
        <div class="stage-grain" aria-hidden="true"></div>
        <div class="stage-status" aria-hidden="true"><span class="stage-status__pulse"></span><span id="stage-status">LOADING / ID3</span></div>
        <div class="stage-coordinate" aria-hidden="true">31°13' N<br>121°28' E</div>
        <div class="stage-note" aria-hidden="true">FIG. 01 — MP3 / SONNET</div>
        <div class="debug-hud" id="debug-hud" hidden aria-hidden="true"></div>
        <div class="stage-loading" id="stage-loading">
          <span class="stage-loading__bar"></span>
          <p>正在读取 MP3 与 ID3 歌词…</p>
        </div>
        <div class="stage-error" id="stage-error" hidden></div>
        <noscript><p class="stage-error">需要启用 JavaScript 才能观看动态字幕。</p></noscript>
      </div>

      <p class="sr-only" id="lyric-live" aria-live="polite">正在读取歌词</p>
      <pre class="sr-only" id="lyric-transcript" aria-label="歌词文本"></pre>

      <section class="transport" aria-label="播放控制">
        <div class="track-info">
          <span class="track-cover" id="track-cover" aria-hidden="true">
            <img id="cover-image" alt="" hidden>
            <span class="track-cover__moon"></span><span class="track-cover__wave"></span><span class="track-cover__name">SONNET<br>PLAY</span>
          </span>
          <div class="track-info__copy">
            <span class="track-info__eyebrow">NOW PLAYING <span>·</span> ID3 / MP3</span>
            <strong id="track-title">正在读取 MP3…</strong>
            <span id="track-meta">等待 ID3 歌词</span>
          </div>
        </div>
        <div class="transport-center">
          <div class="timeline-row">
            <span class="time-label" id="current-time">00:00</span>
            <label class="progress-control">
              <span class="sr-only">播放进度</span>
              <input id="progress" type="range" min="0" max="0" step="0.01" value="0" aria-label="播放进度" aria-valuetext="00:00 / --:--" disabled>
              <span class="progress-rail" aria-hidden="true">
                <span class="progress-fill" id="progress-fill"></span>
                <span class="progress-thumb" id="progress-thumb"></span>
                <span class="progress-markers" id="progress-markers"></span>
              </span>
            </label>
            <span class="time-label time-label--total" id="total-time">--:--</span>
          </div>
          <div class="transport-buttons">
            <button class="icon-button" id="replay" type="button" aria-label="从头播放" title="从头播放" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 9.2A7.5 7.5 0 1 1 4.5 14M4.5 5.2v4.5H9"/><path d="M12 8.8v3.6l2.3 1.4"/></svg>
            </button>
            <button class="play-button" id="play" type="button" aria-label="播放" aria-pressed="false" disabled>
              <svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 10 6-10 6z"/></svg>
              <svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>
            </button>
            <span class="transport-hint">SPACE <span>TO PLAY</span></span>
          </div>
        </div>
        <div class="transport-right">
          <span class="preset-label">PRESET</span>
          <div class="segmented" role="group" aria-label="视觉预设">
            <button type="button" data-preset="showcase" aria-pressed="true">SHOWCASE</button>
            <button type="button" data-preset="player" aria-pressed="false">PLAYER</button>
          </div>
        </div>
      </section>
    </section>

    <aside class="settings-panel" id="settings-panel" hidden aria-label="场景设置">
      <header class="settings-panel__header">
        <div>
          <p class="eyebrow">SONNET CONTROL</p>
          <h2>场景参数</h2>
        </div>
        <button class="ghost-button" id="settings-close" type="button" aria-label="关闭设置">关闭</button>
      </header>
      <div class="settings-group">
        <span class="settings-label">视觉预设</span>
        <div class="segmented" role="group" aria-label="视觉预设">
          <button type="button" data-preset="showcase" aria-pressed="true">SHOWCASE</button>
          <button type="button" data-preset="player" aria-pressed="false">PLAYER</button>
        </div>
      </div>
      <div class="settings-group">
        <span class="settings-label">运动强度</span>
        <div class="segmented" role="group" aria-label="运动强度" id="intensity-group">
          <button type="button" data-intensity="calm" aria-pressed="false">CALM</button>
          <button type="button" data-intensity="normal" aria-pressed="true">NORMAL</button>
          <button type="button" data-intensity="chaotic" aria-pressed="false">CHAOTIC</button>
        </div>
      </div>
      <div class="settings-group">
        <label class="settings-label" for="seed-input">节目单种子</label>
        <div class="seed-row">
          <input id="seed-input" type="text" spellcheck="false" autocomplete="off" aria-label="节目单种子" placeholder="由歌词自动生成" disabled>
          <button class="ghost-button" id="seed-apply" type="button" disabled>应用</button>
          <button class="ghost-button" id="seed-random" type="button" disabled>随机</button>
        </div>
        <p class="settings-note">种子由歌曲与解析出的歌词生成，只改变镜头与编舞，不改变歌词时间。</p>
      </div>
      <div class="settings-group">
        <span class="settings-label">导入文件</span>
        <div class="audio-row">
          <label class="ghost-button file-button">
            <input id="audio-file" type="file" accept="audio/mpeg,audio/mp3,.mp3" aria-label="导入 MP3 并读取内嵌歌词">
            导入 MP3
          </label>
          <label class="ghost-button file-button">
            <input id="lyric-file" type="file" accept=".lrc,.txt,text/plain" aria-label="导入 LRC 歌词文件">
            导入 LRC
          </label>
        </div>
        <p class="settings-note" id="audio-note">正在读取内置 MP3 的 ID3 歌词…</p>
        <p class="settings-note">支持标准 LRC、[offset]、逐行多时间戳，以及增强型 &lt;mm:ss.xx&gt; 逐词标签；导入后按当前音频重建节目单。</p>
      </div>
      <div class="settings-group settings-group--row">
        <label class="check-row"><input id="debug-toggle" type="checkbox"> 显示调试 HUD（D）</label>
        <label class="check-row"><input id="reduced-toggle" type="checkbox"> 降低运动幅度</label>
      </div>
      <div class="settings-group license-group">
        <span class="settings-label">LICENSE / 许可</span>
        <div class="license-actions">
          <button class="ghost-button" id="copy-mit" type="button" data-copy="mit">复制 MIT 许可证</button>
          <button class="ghost-button" id="copy-notice" type="button" data-copy="full">复制完整声明</button>
        </div>
        <p class="settings-note" id="copy-status" role="status" aria-live="polite">引擎为 MIT 许可；演示音频为第三方版权内容，不在此许可范围内。</p>
        <details class="license-details">
          <summary>查看 MIT 许可证全文</summary>
          <pre>${MIT_LICENSE}</pre>
        </details>
        <p class="settings-note">${AUDIO_NOTICE}</p>
      </div>
      <footer class="settings-panel__footer">
        <span>SONNET / FOLIA v0.7.2 · MIT</span>
        <span>WEBGL2 · MP3 → LYRICS → MOTION</span>
      </footer>
    </aside>

    <footer class="page-footer">
      <span>DESIGNED TO BE FELT, NOT JUST READ.</span>
      <span class="page-footer__center">ID3 LYRICS <i>×</i> TYPE IN MOTION</span>
      <span>SONNET / LAB <b>↗</b></span>
    </footer>
  </main>`
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--'
  const safe = Math.floor(seconds)
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}
