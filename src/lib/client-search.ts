import type { SearchDocument, SearchIndexPayload } from './search';

export type SearchResultItem = {
  id: string;
  slug: string;
  title: string;
  url: string;
  date: string | null;
  excerpt: string;
  matchedFields: Array<'title' | 'content'>;
  score: number;
};

type FlexDocument = {
  add: (document: SearchDocument) => void;
  search: (query: string, options?: Record<string, unknown>) => unknown;
};

type SearchResources = {
  documents: SearchDocument[];
  documentMap: Map<string, SearchDocument>;
  index: FlexDocument;
};

type SearchField = 'title' | 'content';

export const MIN_QUERY_LENGTH = 2;

const resourceCache = new Map<string, Promise<SearchResources>>();

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('zh-CN').trim();
}

function normalizeSearchIds(input: unknown): string[] {
  const ids = new Set<string>();

  const walk = (value: unknown) => {
    if (typeof value === 'string' || typeof value === 'number') {
      ids.add(String(value));
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (!value || typeof value !== 'object') {
      return;
    }

    const maybeRecord = value as Record<string, unknown>;
    if (typeof maybeRecord.id === 'string' || typeof maybeRecord.id === 'number') {
      ids.add(String(maybeRecord.id));
    }
    if ('result' in maybeRecord) {
      walk(maybeRecord.result);
    }
    if ('doc' in maybeRecord) {
      walk(maybeRecord.doc);
    }
  };

  walk(input);
  return [...ids];
}

function compareByDateDesc(a: SearchDocument, b: SearchDocument): number {
  const aTime = a.date ? Date.parse(a.date) : 0;
  const bTime = b.date ? Date.parse(b.date) : 0;
  const safeATime = Number.isNaN(aTime) ? 0 : aTime;
  const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
  return safeBTime - safeATime;
}

function trimExcerpt(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function createExcerpt(document: SearchDocument, query: string): string {
  const normalizedQuery = normalizeText(query);
  const description = document.description?.trim() ?? '';

  if (description) {
    const normalizedDescription = normalizeText(description);
    if (normalizedDescription.includes(normalizedQuery)) {
      return trimExcerpt(description, 120);
    }
  }

  const content = document.content.trim();
  if (!content) {
    return description || '暂无摘要';
  }

  const normalizedContent = normalizeText(content);
  const matchIndex = normalizedContent.indexOf(normalizedQuery);
  if (matchIndex === -1) {
    return trimExcerpt(description || content, 120);
  }

  const start = Math.max(0, matchIndex - 28);
  const end = Math.min(content.length, matchIndex + Math.max(query.length, 24) + 48);
  const excerpt = content.slice(start, end).trim();

  return `${start > 0 ? '...' : ''}${trimExcerpt(excerpt, 128)}${end < content.length ? '...' : ''}`;
}

async function loadSearchResources(endpoint: string): Promise<SearchResources> {
  const cached = resourceCache.get(endpoint);
  if (cached) {
    return cached;
  }

  const loader = (async () => {
    const [{ Document }, response] = await Promise.all([
      import('flexsearch'),
      fetch(endpoint),
    ]);

    if (!response.ok) {
      throw new Error(`Failed to load search index: ${response.status}`);
    }

    const payload = (await response.json()) as SearchIndexPayload;
    const documents = payload.items;
    const documentMap = new Map(documents.map((item) => [item.id, item]));
    const index = new Document({
      cache: 100,
      document: {
        id: 'id',
        index: [
          {
            field: 'title',
            tokenize: 'forward',
          },
          {
            field: 'content',
            tokenize: 'full',
          },
        ],
      },
    }) as FlexDocument;

    for (const item of documents) {
      index.add(item);
    }

    return {
      documents,
      documentMap,
      index,
    };
  })();

  resourceCache.set(endpoint, loader);
  return loader;
}

function searchField(index: FlexDocument, field: SearchField, query: string, limit: number): string[] {
  const results = index.search(query, {
    index: [field],
    limit,
    suggest: true,
  });

  return normalizeSearchIds(results);
}

export async function searchPosts(
  query: string,
  options?: {
    endpoint?: string;
    limit?: number;
  },
): Promise<SearchResultItem[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const endpoint = options?.endpoint ?? '/search-index.json';
  const limit = options?.limit ?? 8;
  const { documents, documentMap, index } = await loadSearchResources(endpoint);
  const titleIds = new Set(searchField(index, 'title', normalizedQuery, limit * 2));
  const contentIds = new Set(searchField(index, 'content', normalizedQuery, limit * 2));
  const candidateIds = new Set([...titleIds, ...contentIds]);
  const normalizedNeedle = normalizeText(normalizedQuery);

  for (const document of documents) {
    const titleMatch = normalizeText(document.title).includes(normalizedNeedle);
    const descriptionMatch = normalizeText(document.description ?? '').includes(normalizedNeedle);
    const contentMatch = normalizeText(document.content).includes(normalizedNeedle);

    if (titleMatch || descriptionMatch || contentMatch) {
      candidateIds.add(document.id);
      if (titleMatch) {
        titleIds.add(document.id);
      }
      if (contentMatch || descriptionMatch) {
        contentIds.add(document.id);
      }
    }
  }

  const results = [...candidateIds]
    .map((id) => {
      const document = documentMap.get(id);
      if (!document) {
        return null;
      }

      const matchedFields: Array<'title' | 'content'> = [];
      if (titleIds.has(id)) {
        matchedFields.push('title');
      }
      if (contentIds.has(id)) {
        matchedFields.push('content');
      }

      let score = 0;
      if (titleIds.has(id)) score += 120;
      if (contentIds.has(id)) score += 50;
      if (titleIds.has(id) && contentIds.has(id)) score += 35;

      if (normalizeText(document.title).includes(normalizedNeedle)) {
        score += 30;
      }
      if (normalizeText(document.content).includes(normalizedNeedle)) {
        score += 12;
      }

      return {
        id: document.id,
        slug: document.slug,
        title: document.title,
        url: document.url,
        date: document.date,
        excerpt: createExcerpt(document, normalizedQuery),
        matchedFields,
        score,
        document,
      };
    })
    .filter((item): item is SearchResultItem & { document: SearchDocument } => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return compareByDateDesc(a.document, b.document);
    })
    .slice(0, limit)
    .map(({ document: _document, ...item }) => item);

  return results;
}
