import { getCollection } from 'astro:content';
import type { PostSummary } from './posts';

export type SearchDocument = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
  content: string;
  url: string;
};

export type SearchIndexPayload = {
  generatedAt: string;
  total: number;
  items: SearchDocument[];
};

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---[\s\S]*?---\s*/m, '');
}

function stripCodeBlocks(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ');
}

function stripMarkdownSyntax(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~|]/g, ' ');
}

export function sanitizeMarkdownForSearch(markdown: string): string {
  return stripMarkdownSyntax(stripCodeBlocks(stripFrontmatter(markdown)))
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 供 PostSummary 来源类型复用（避免循环依赖，类型引用）
export type { PostSummary };

/**
 * 基于 Content Collections，从 entry.body 取原始 markdown 正文构建搜索文档。
 * glob loader 默认保留 body，无需再 import.meta.glob('?raw')。
 */
export async function getSearchDocuments(): Promise<SearchDocument[]> {
  const entries = await getCollection('posts');
  return entries.map((entry) => {
    const data = entry.data;
    const slug = entry.id;
    const title = String(data.title ?? slug);
    const description = data.description ? String(data.description) : null;
    const date = data.date ? String(data.date) : null;
    const body = entry.body ?? '';

    return {
      id: slug,
      slug,
      title,
      description,
      date,
      content: sanitizeMarkdownForSearch(body),
      url: `/posts/${encodeURIComponent(slug)}`,
    };
  });
}

export async function getSearchIndexPayload(): Promise<SearchIndexPayload> {
  const items = await getSearchDocuments();
  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    items,
  };
}