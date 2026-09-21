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

