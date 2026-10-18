import { describe, expect, it } from 'vitest'
import { DEFAULT_TRACK_MIME, DEFAULT_TRACK_NAME, DEFAULT_TRACK_PATH, assertMp3, looksLikeMp3 } from '../../src/features/sonnet/default-track'

function bytes(values: number[], length = 2048): ArrayBuffer {
  const buffer = new Uint8Array(Math.max(length, values.length))
  buffer.set(values)
  return buffer.buffer
}

describe('default track URL', () => {
  it('stays extension-less so download managers do not claim the request', () => {
    expect(DEFAULT_TRACK_PATH).not.toMatch(/\.(mp3|m4a|wav|ogg|flac)$/i)
    expect(DEFAULT_TRACK_PATH.startsWith('/media/')).toBe(true)
  })

  it('still types the parsed File as audio for music-metadata', () => {
    expect(DEFAULT_TRACK_MIME).toBe('audio/mpeg')
    expect(DEFAULT_TRACK_NAME.endsWith('.mp3')).toBe(true)
  })
})

describe('MP3 payload guard', () => {
  it('accepts an ID3-tagged payload', () => {
    expect(looksLikeMp3(bytes([0x49, 0x44, 0x33, 0x04]))).toBe(true)
    expect(() => assertMp3(bytes([0x49, 0x44, 0x33, 0x04]))).not.toThrow()
  })

  it('accepts a bare MPEG frame sync', () => {
    expect(looksLikeMp3(bytes([0xff, 0xfb, 0x90]))).toBe(true)
    expect(() => assertMp3(bytes([0xff, 0xfb, 0x90]))).not.toThrow()
  })

  it('rejects an HTML error page returned by an interceptor', () => {
    const html = new TextEncoder().encode(`<!doctype html><html><body>blocked</body></html>${' '.repeat(2000)}`)
    expect(looksLikeMp3(html.buffer)).toBe(false)
    expect(() => assertMp3(html.buffer)).toThrow(/不是 MP3/)
  })

  it('rejects an empty body', () => {
    expect(() => assertMp3(new ArrayBuffer(0))).toThrow(/过短/)
  })

  it('rejects a truncated download', () => {
    expect(() => assertMp3(bytes([0x49, 0x44, 0x33], 64))).toThrow(/过短/)
  })
})
