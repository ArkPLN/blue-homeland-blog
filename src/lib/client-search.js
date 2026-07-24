export const MIN_QUERY_LENGTH = 2;

const resourceCache = new Map();

function normalizeText(value) {
  return value.toLocaleLowerCase('zh-CN').trim();
}

function normalizeSearchIds(input) {
  const ids = new Set();

  const walk = (value) => {
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

    if (typeof value.id === 'string' || typeof value.id === 'number') {
      ids.add(String(value.id));
    }

    if ('result' in value) {
      walk(value.result);
    }

    if ('doc' in value) {
      walk(value.doc);
    }
  };

  walk(input);
  return [...ids];
}

function compareByDateDesc(a, b) {
  const aTime = a.date ? Date.parse(a.date) : 0;
  const bTime = b.date ? Date.parse(b.date) : 0;
  const safeATime = Number.isNaN(aTime) ? 0 : aTime;
  const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
  return safeBTime - safeATime;
}

function trimExcerpt(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function createExcerpt(document, query) {
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

async function loadSearchResources(endpoint) {
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

    const payload = await response.json();
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
    });

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

function searchField(index, field, query, limit) {
  const results = index.search(query, {
    index: [field],
    limit,
    suggest: true,
  });

  return normalizeSearchIds(results);
}

export async function searchPosts(query, options) {
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

  return [...candidateIds]
    .map((id) => {
      const document = documentMap.get(id);
      if (!document) {
        return null;
      }

      const matchedFields = [];
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
    .filter((item) => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return compareByDateDesc(a.document, b.document);
    })
    .slice(0, limit)
    .map(({ document: _document, ...item }) => item);
}
