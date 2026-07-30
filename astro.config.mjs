// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkMermaidToHtml } from './src/lib/remark-mermaid.mjs';

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
  site: process.env.SITE_URL ?? 'https://arkpln.netlify.app',
  markdown: {
    remarkPlugins: [remarkKeepImageAsHtml, remarkMermaidToHtml, remarkReadingTime],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
    ],
  },
  integrations: [
    sitemap({
      serialize(item) {
        // 首页
        if (/^https?:\/\/[^/]+\/?$/.test(item.url)) {
          item.changefreq = 'daily';
          item.priority = 1.0;
          return item;
        }
        // 文章详情页
        if (item.url.includes('/posts/')) {
          item.changefreq = 'weekly';
          item.priority = 0.8;
          return item;
        }
        // 分类页
        if (item.url.includes('/category/')) {
          item.changefreq = 'weekly';
          item.priority = 0.7;
          return item;
        }
        // 标签页
        if (item.url.includes('/tag/')) {
          item.changefreq = 'weekly';
          item.priority = 0.6;
          return item;
        }
        // 关于页
        if (item.url.endsWith('/about')) {
          item.changefreq = 'monthly';
          item.priority = 0.6;
          return item;
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwind()],
  },
});
