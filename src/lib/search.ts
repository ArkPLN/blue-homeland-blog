import { extractSlug, getAllPosts } from './posts';

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

type RawPostMap = Record<string, string>;

const rawPostMap = import.meta.glob('../../posts/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as RawPostMap;

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

export function getSearchDocuments(): SearchDocument[] {
  const rawBySlug = new Map<string, string>();
  for (const [filePath, rawMarkdown] of Object.entries(rawPostMap)) {
    rawBySlug.set(extractSlug(filePath), rawMarkdown);
  }

  return getAllPosts().map((post) => {
    const rawMarkdown = rawBySlug.get(post.slug) ?? '';
    return {
      id: post.slug,
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      content: sanitizeMarkdownForSearch(rawMarkdown),
      url: `/posts/${encodeURIComponent(post.slug)}`,
    };
  });
}

export function getSearchIndexPayload(): SearchIndexPayload {
  const items = getSearchDocuments();
  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    items,
  };
}
