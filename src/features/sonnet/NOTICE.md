# Notices and attribution

## Demo music

`public/media/qingmingshanghetu` is **颜小亿 —《清明上河图（同花顺进行曲）》**,
supplied by the user for this demonstration. It is third-party copyrighted music and
is **not** covered by the MIT license of this repository. Remove it before
redistributing the project.
The app reads its ID3 tags locally in the browser; nothing is uploaded.

The file has no extension and is served as `application/octet-stream` on purpose:
download managers such as IDM intercept `*.mp3` / `audio/*` responses and would
otherwise break in-page loading.

## Third-party software

- **music-metadata** — https://github.com/borewit/music-metadata
  MIT License. Used to read ID3v2 tags (USLT / SYLT / LRC lyrics), cover art,
  title/artist/album and duration.
- **WebGL2 / Canvas 2D** — platform APIs.

## Algorithmic reference

The kinetic typography choreography (paragraphs, shots, camera, typography roles,
minimum graphics, transitions, post-processing) is a web reimplementation of the
Sonnet effect documented in:

- **KugouMusic.NET** — https://github.com/Linsxyx/KugouMusic.NET
  Copyright (c) 2026 Linsxyx. MIT License.
- The C# project documents itself as a port of **Folia v0.7.2** —
  https://github.com/chthollyphile/folia-major (AGPL-3.0).

No Folia source code was copied into this repository. This implementation was
written from the MIT-licensed C# implementation and its documented behavior.

## Demo content

The demo program is compiled at runtime from the lyrics embedded in the selected
MP3. There is no hard-coded lyric text or lyric-specific animation curve in the
application. The small synthetic lyric set in `src/test/sonnet.test.ts` exists only
as a unit-test fixture and is never loaded by the demo.
