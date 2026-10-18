/**
 * Single source of truth for the licensing text shown on /music.
 *
 * The engine is MIT licensed, the demo audio is not. Keep the two separate so
 * the page, the settings panel and the tests can all quote the same strings.
 */

export const MIT_LICENSE = `MIT License

Copyright (c) 2026 Sonnet WebGL Demo contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

export const THIRD_PARTY_NOTICE = `第三方声明与署名

一、代码许可
Sonnet 引擎以 MIT 许可证发布，Copyright (c) 2026 Sonnet WebGL Demo contributors。
完整许可证文本见本页「MIT 许可证」区块，可一键复制。

二、第三方软件
- music-metadata — https://github.com/borewit/music-metadata
  MIT License，Copyright © 2026 Borewit。
  用于在浏览器内读取 ID3v2 标签（USLT / SYLT / LRC 歌词）、封面、标题、歌手、专辑与时长。
- Lucide — https://lucide.dev
  ISC License，用于站点与页面的图标。
- WebGL2 / Canvas 2D / Web Audio API — 浏览器平台 API。

三、算法参考
动态排版编排（段落、镜头、相机、排版角色、MG、转场、后处理）
参考 MIT 许可的 KugouMusic.NET — https://github.com/Linsxyx/KugouMusic.NET
Copyright (c) 2026 Linsxyx, MIT License。

KugouMusic.NET 自述为 Folia v0.7.2 的移植 —
https://github.com/chthollyphile/folia-major (AGPL-3.0)。
本项目未复制 Folia 源代码，仅依据 MIT 许可的 C# 实现及其公开行为重写。

四、演示音频
默认曲目《清明上河图（同花顺进行曲）》— 颜小亿，
是第三方版权音乐，版权归其权利人所有。
该音频不属于 MIT 许可证的适用范围，仅在本站作技术演示之用。
音频文件位于 /media/qingmingshanghetu，解析全部在浏览器本地完成，不会上传。`

export const AUDIO_NOTICE =
  '演示曲目《清明上河图（同花顺进行曲）》由颜小亿演唱，版权归其权利人所有；该音频不包含在 MIT 许可范围内，仅用于本站技术演示。用户自行导入的音频只在浏览器本地处理，不会上传。'

/** Everything the "copy full notice" button writes to the clipboard. */
export const FULL_NOTICE = `${THIRD_PARTY_NOTICE}

五、MIT 许可证全文

${MIT_LICENSE}`

export type CopyTarget = 'mit' | 'full'

/**
 * Copy text to the clipboard.
 *
 * `navigator.clipboard` needs a secure context, so fall back to a hidden
 * textarea for plain-HTTP deployments and older browsers.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy path.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}
