/**
 * Default demo track.
 *
 * The path is intentionally extension-less and served as
 * `application/octet-stream` (see `netlify.toml`). Download managers such as
 * IDM claim requests based on a `*.mp3` extension or an `audio/*` content type;
 * when that happens the player's `fetch` receives an empty or partial body and
 * Chromium then fails ranged requests with `net::ERR_REQUEST_RANGE_NOT_SATISFIABLE`.
 */
export const DEFAULT_TRACK_PATH = '/media/qingmingshanghetu'

/** The File is still typed as audio so `music-metadata` picks the MP3 parser. */
export const DEFAULT_TRACK_NAME = 'qingmingshanghetu.mp3'

export const DEFAULT_TRACK_MIME = 'audio/mpeg'

/** True when the bytes start with an ID3 tag or an MPEG audio frame sync. */
export function looksLikeMp3(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 3) return false
  const head = new Uint8Array(buffer, 0, 3)
  const id3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33
  const frame = head[0] === 0xff && (head[1] & 0xe0) === 0xe0
  return id3 || frame
}

/** Throw a descriptive error instead of letting a broken buffer reach the decoder. */
export function assertMp3(buffer: ArrayBuffer): void {
  if (buffer.byteLength < 1024) {
    throw new Error(`音频数据过短（${buffer.byteLength} 字节）`)
  }
  if (!looksLikeMp3(buffer)) {
    throw new Error('返回内容不是 MP3（可能被下载管理器或代理拦截）')
  }
}
