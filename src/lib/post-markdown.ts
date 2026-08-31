import type { CollectionEntry } from 'astro:content';

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---[\s\S]*?---\s*/m, '');
}

export function formatPostMarkdown(entry: CollectionEntry<'posts'>): string {
  const data = entry.data;
  const title = String(data.title ?? entry.id);
  const description = data.description ? String(data.description) : null;
  const date = data.date ? String(data.date) : null;
  const body = stripFrontmatter(entry.body ?? '');

  const parts = [`# ${title}`];
  if (description) parts.push(`> ${description}`);
  if (date) parts.push(`Published: ${date}`);
  parts.push(body.trim());

  return parts.filter(Boolean).join('\n\n');
}

export function postMarkdownUrl(site: string, slug: string): string {
  return new URL(`/posts/${encodeURIComponent(slug)}.md`, site).href;
}

export function postHtmlUrl(site: string, slug: string): string {
  return new URL(`/posts/${encodeURIComponent(slug)}/`, site).href;
}
