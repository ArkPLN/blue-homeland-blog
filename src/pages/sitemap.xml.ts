import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/posts';

function formatDate(input: string | null): string {
  if (!input) return new Date().toISOString();
  const normalized = input.trim().replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://arkpln.netlify.app');
  const posts = getAllPosts();

  const staticPages = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.6' },
  ];

  const dynamicPostPages = posts.map((post) => ({
    path: `/posts/${encodeURIComponent(post.slug)}`,
    lastmod: formatDate(post.date),
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const dynamicCategoryPages = [...new Set(posts.map((post) => post.category))]
    .filter(Boolean)
    .map((category) => ({
      path: `/category/${encodeURIComponent(category)}`,
      changefreq: 'weekly',
      priority: '0.7',
    }));

  const dynamicTagPages = [...new Set(posts.flatMap((post) => post.tags))]
    .filter(Boolean)
    .map((tag) => ({
      path: `/tag/${encodeURIComponent(tag)}`,
      changefreq: 'weekly',
      priority: '0.6',
    }));

  const urls = [...staticPages, ...dynamicPostPages, ...dynamicCategoryPages, ...dynamicTagPages];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((item) => {
    const loc = new URL(item.path, base).toString();
    const lastmod = 'lastmod' in item ? `<lastmod>${item.lastmod}</lastmod>` : '';
    return `<url><loc>${loc}</loc>${lastmod}<changefreq>${item.changefreq}</changefreq><priority>${item.priority}</priority></url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
