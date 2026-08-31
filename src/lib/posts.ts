import { getCollection, type CollectionEntry } from 'astro:content';

export type PostSummary = {
  slug: string;
  title: string;
  date: string | null;
  description: string | null;
  categories: string[];
  tags: string[];
};

type PostEntry = CollectionEntry<'posts'>;

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toTimestamp(dateValue: string | null): number {
  if (!dateValue) return 0;
  // 兼容 "YYYY-MM-DD HH:mm:ss"（空格分隔）格式
  const normalized = dateValue.trim().replace(/\s+/, 'T');
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * 返回全部文章摘要，按日期降序。
 * 基于 Content Collections getCollection，类型安全的 frontmatter。
 */
export async function getAllPosts(): Promise<PostSummary[]> {
  const entries = await getCollection('posts');
  return entries
    .map((entry) => {
      const data = entry.data;
      const title = String(data.title ?? entry.id);
      const date = data.date ? String(data.date) : null;
      const description = data.description ? String(data.description) : null;
      const categories = toStringArray(data.categories ?? data.category);
      const tags = toStringArray(data.tags ?? data.tag);

      return {
        slug: entry.id,
        title,
        date,
        description,
        categories,
        tags,
      };
    })
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

export function groupPostsByCategory(posts: PostSummary[]): Map<string, PostSummary[]> {
  const grouped = new Map<string, PostSummary[]>();

  for (const post of posts) {
    for (const category of post.categories) {
      const current = grouped.get(category) ?? [];
      current.push(post);
      grouped.set(category, current);
    }
  }

  return new Map([...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function groupPostsByTag(posts: PostSummary[]): Map<string, PostSummary[]> {
  const grouped = new Map<string, PostSummary[]>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const current = grouped.get(tag) ?? [];
      current.push(post);
      grouped.set(tag, current);
    }
  }

  return new Map([...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export async function getPostCount(): Promise<number> {
  const entries = await getCollection('posts');
  return entries.length;
}