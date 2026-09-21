/**
 * 把 Markdown 中的相对图片路径改写为环境感知的绝对路径。
 *
 * 约定：文章 Markdown 里用相对于 `public/images/` 的路径引用本地图片，
 * 例如 `![](./trae-work-reimburse/01-pain-point.webp)` 或 `![](trae-work-reimburse/01-pain-point.webp)`，
 * 对应源图统一放在 `public/images/<相对路径>`，与 Netlify Image CDN 的源图 `/images/<相对路径>` 一一对应。
 *
 * - 本机 `astro dev`、`astro build` + `astro preview`（未启用 CDN）：改写为 `/images/<相对路径>`，
 *   由 `public/images/` 直接静态提供，保证本地可渲染（不经 CDN 转换）。
 * - Netlify 构建部署 / `netlify dev`（启用 CDN）：改写为 `/cdn-img/<相对路径>`，
 *   经 netlify.toml 重写到 `/.netlify/images?url=/images/<相对路径>&w=1280&q=80`，走 Netlify Image CDN。
 *
 * 是否启用 CDN 由 astro.config.mjs 在配置加载时读取环境变量后通过 `options.cdn` 传入，
 * 而不是在 transform 里直接读 process.env——后者运行在 Vite markdown 编译的工作进程，
 * 拿不到主进程的 shell 环境变量。
 *
 * 远程 URL（http(s)://）、`data:`、`mailto:` 以及已写死的绝对路径（以 `/` 开头）保持原样，
 * 交由后续 remarkKeepImageAsHtml 处理为 `<img>`。
 *
 * 必须排在 remarkKeepImageAsHtml 之前：本插件改写 image 节点的 url，
 * remarkKeepImageAsHtml 再把改写后的 url 原样写入 `<img src>`。
 */
function isRemoteOrSpecial(src) {
  return (
    /^(https?:)?\/\//.test(src) ||
    src.startsWith('data:') ||
    src.startsWith('mailto:') ||
    src.startsWith('/')
  );
}

export function remarkImageCdn({ cdn = false } = {}) {
  return function (tree) {
    const prefix = cdn ? '/cdn-img' : '/images';
    const walk = (node) => {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (child.type === 'image' && child.url) {
          const src = String(child.url);
          if (isRemoteOrSpecial(src)) continue;
          // 相对路径：去掉前导 ./ ./ / 等前缀，拼到 /images 或 /cdn-img 下
          const rest = src.replace(/^\.?\/+/, '');
          if (!rest) continue;
          child.url = `${prefix}/${rest}`;
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
