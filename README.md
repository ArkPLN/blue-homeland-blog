# Astro Starter Kit: Minimal

```sh
pnpm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## 🖼 文章图片引用规则

文章里的本地图片统一放在 `public/images/` 下，Markdown 里用相对 `public/images/` 的路径引用：

```md
![说明](./trae-work-reimburse/01-pain-point.webp)
```

对应源图位置：`public/images/trae-work-reimburse/01-pain-point.webp`

构建时 `remarkImageCdn` 插件（`src/lib/remark-image-cdn.mjs`）按环境自动改写路径：

- 本机 `pnpm dev` / `pnpm preview`：改写成 `/images/<相对路径>`，直接走静态文件，本地可渲染。
- Netlify 部署（`NETLIFY=true`）：改写成 `/cdn-img/<相对路径>`，经 `netlify.toml` 重定向到 `/.netlify/images?url=/images/:splat&w=1280&q=80`，走 Netlify Image CDN 转换与内容协商。

远程图片（`http(s)://`）、`data:` URI、以及已写死的绝对路径（以 `/` 开头）保持原样。frontmatter 的 `cover` 字段由布局组件单独渲染，按绝对路径写 `/images/...` 即可。

约定要点：

- 源图只放 `public/images/` 下，Markdown 里写相对路径，两边一一对应。
- 不要在 Markdown 里写 `/cdn-img/...` 或 `/images/...` 绝对路径，会让本机预览失效。

## 🎵 音乐 / 动态字幕页（`/music`）

顶栏的音乐图标（`SiteHeader.astro` 中 `<GlobalSearch />` 左侧）进入 `/music`，页面由
`src/pages/music/index.astro` 承载，渲染引擎来自独立项目 Sonnet（WebGL2 + 原生 TS）。

- 引擎源码：`src/features/sonnet/`（`engine/` 原样移植，`main.ts` / `markup.ts` 为博客适配版）
- 默认曲目：`public/media/qingmingshanghetu`（《清明上河图（同花顺进行曲）》— 颜小亿，无扩展名 + `application/octet-stream`，避免 IDM 拦截）
- 样式：`src/style/sonnet.css`，全部选择器都以 `.sonnet-root` 为前缀，不会影响博客其他页面
- 许可文案：`src/features/sonnet/license.ts` 是唯一事实源，页面与设置面板都引用它
- 测试：`tests/sonnet/`（`pnpm test` 会一起跑）

添加或替换默认曲目时，需同步修改 `src/features/sonnet/main.ts` 的 `DEFAULT_TRACK_PATH`
与 `tests/sonnet/mp3.test.ts` 的断言。演示音频为第三方版权内容，**不在 MIT 许可范围内**。
