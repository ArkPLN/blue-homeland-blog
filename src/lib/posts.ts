type MarkdownModule = {
  default: unknown;
  frontmatter?: Record<string, unknown>;
};

export type PostSummary = {
  slug: string;
  title: string;
  date: string | null;
  description: string | null;
  categories: string[];
  tags: string[];
};

const postModules = import.meta.glob('../../posts/*.md', {
  eager: true,
}) as Record<string, MarkdownModule>;

const postLoaders = import.meta.glob('../../posts/*.md');

function safeDecodeFileName(filePath: string): string {
  const fileName = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? '';
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function normalizeSlug(value: string): string {
  return value.replace(/%/g, '-');
}

export function extractSlug(filePath: string): string {
  return normalizeSlug(safeDecodeFileName(filePath).replace(/\.md$/i, ''));
}

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
  const timestamp = Date.parse(dateValue);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getAllPosts(): PostSummary[] {
  return Object.entries(postModules)
    .map(([filePath, mod]) => {
      const frontmatter = mod.frontmatter ?? {};
      const title = String(frontmatter.title ?? extractSlug(filePath));
      const date = frontmatter.date ? String(frontmatter.date) : null;
      const description = frontmatter.description ? String(frontmatter.description) : null;
      const categories = toStringArray(frontmatter.categories ?? frontmatter.category);
      const tags = toStringArray(frontmatter.tags ?? frontmatter.tag);

      return {
        slug: extractSlug(filePath),
        title,
        date,
        description,
        categories,
        tags,
      };
    })
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

export function getPostLoaders() {
  return postLoaders;
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

export const postsLength = Object.keys(postModules).length;