// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

/**
 * 将 Markdown 图片节点转成普通 HTML，绕过 Astro 对本地图片路径的解析与校验。
 */
function remarkKeepImageAsHtml() {
  return (tree) => {
    const walk = (node) => {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (child.type === 'image') {
          const alt = String(child.alt ?? '').replace(/"/g, '&quot;');
          const src = String(child.url ?? '');
          const title = child.title ? ` title="${String(child.title).replace(/"/g, '&quot;')}"` : '';
          child.type = 'html';
          child.value = `<img src="${src}" alt="${alt}"${title} />`;
          delete child.url;
          delete child.alt;
          delete child.title;
        }
        walk(child);
      }
    };

    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkKeepImageAsHtml],
  },
  vite: {
    plugins: [tailwind()]
  }
});
