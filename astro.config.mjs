// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import astroLlmsTxt from '@4hse/astro-llms-txt';
import { llmsPostIndex } from './src/integrations/llms-post-index';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkMermaidToHtml } from './src/lib/remark-mermaid.mjs';
import { remarkImageCdn } from './src/lib/remark-image-cdn.mjs';

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
// Netlify 构建置 NETLIFY=true、netlify dev 置 NETLIFY_DEV=true；本机 astro dev/preview 两者皆无。
// 在配置加载时（主进程）读取，通过插件选项闭包传入，避免在 Vite markdown 工作进程里拿不到环境变量。
const imageCdnEnabled =
  process.env.NETLIFY === 'true' || process.env.NETLIFY_DEV === 'true';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://arkpln.netlify.app',
  markdown: {
    remarkPlugins: [[remarkImageCdn, { cdn: imageCdnEnabled }], remarkKeepImageAsHtml, remarkMermaidToHtml, remarkReadingTime],
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
    astroLlmsTxt({
      title: '蔚蓝之家',
      description:
        '蔚蓝之家是一个以前端开发、全栈实践与 AI 应用探索为主题的中文技术博客。',
      details:
        '建议先阅读 /llms.txt 获取站点索引（含每篇文章的 .md 链接）；单篇 Markdown 位于 /posts/{slug}.md；需要完整正文时使用 /llms-full.txt；token 预算有限时使用 /llms-small.txt。',
      notes: '- 内容由构建时从站点 HTML 自动提取生成。',
      optionalLinks: [
        {
          label: 'About',
          url: 'https://arkpln.netlify.app/about/',
          description: '作者简介与精选仓库',
        },
        {
          label: 'GitHub',
          url: 'https://github.com/ArkPLN',
          description: 'ArkPLN 的 GitHub 主页',
        },
        {
          label: 'Sitemap',
          url: 'https://arkpln.netlify.app/sitemap-index.xml',
          description: '站点地图索引',
        },
      ],
      docSet: [
        {
          title: '博客文章全文',
          description: '全部文章与 About 页的完整 Markdown 正文',
          url: '/llms-full.txt',
          include: ['posts/**', 'about/**'],
          promote: ['posts/**'],
          mainSelector: 'main',
          ignoreSelectors: [
            'header',
            '.content-sidebar',
            '[data-toc-nav]',
            '.post-bg-wrap',
            '.page-bg-wrap',
            '.home-bg-wrap',
            '[data-global-search-root]',
          ],
        },
        {
          title: '博客文章结构索引',
          description: '仅保留标题与列表结构的精简版，适合低 token 场景',
          url: '/llms-small.txt',
          include: ['posts/**'],
          promote: ['posts/**'],
          onlyStructure: true,
          mainSelector: 'main',
          ignoreSelectors: [
            'header',
            '.content-sidebar',
            '[data-toc-nav]',
            '.post-bg-wrap',
            '.page-bg-wrap',
            '.home-bg-wrap',
            '[data-global-search-root]',
          ],
        },
      ],
      pageSeparator: '\n\n---\n\n',
    }),
    llmsPostIndex(),
  ],
  vite: {
    plugins: [tailwind()],
  },
});
