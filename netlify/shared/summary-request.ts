export const SUMMARY_CACHE_VARY = 'query=slug';
export const MAX_SLUG_LENGTH = 160;

const JSON_RESPONSE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Netlify-Vary': SUMMARY_CACHE_VARY,
  'X-Content-Type-Options': 'nosniff',
};

function withSummaryHeaders(headersInit?: HeadersInit): Headers {
  const headers = new Headers(headersInit);
  for (const [name, value] of Object.entries(JSON_RESPONSE_HEADERS)) {
    headers.set(name, value);
  }
  return headers;
}

export type SummaryRequestValidation =
  | { ok: true; requestUrl: URL; slug: string }
  | { ok: false; message: string; status: 400 | 405 };

function isValidSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_SLUG_LENGTH &&
    value === value.trim() &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function validateSummaryRequest(request: Request): SummaryRequestValidation {
  if (request.method !== 'GET') {
    return { ok: false, message: 'Method not allowed', status: 405 };
  }

  const requestUrl = new URL(request.url);
  const entries = [...requestUrl.searchParams.entries()];
  if (
    entries.length !== 1 ||
    entries[0]?.[0] !== 'slug' ||
    requestUrl.searchParams.getAll('slug').length !== 1
  ) {
    return { ok: false, message: 'Invalid query', status: 400 };
  }

  const slug = entries[0][1];
  if (!isValidSlug(slug)) {
    return { ok: false, message: 'Invalid slug', status: 400 };
  }

  const canonicalQuery = new URLSearchParams({ slug }).toString();
  if (requestUrl.search.slice(1) !== canonicalQuery) {
    return { ok: false, message: 'Invalid query', status: 400 };
  }

  return { ok: true, requestUrl, slug };
}

export function summaryJsonResponse(
  body: Record<string, unknown>,
  init: ResponseInit = {},
): Response {
  const headers = withSummaryHeaders(init.headers);

  return Response.json(body, { ...init, headers });
}

export function summaryErrorResponse(
  message: string,
  status: number,
  bodyless = false,
): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (status === 405) headers.set('Allow', 'GET');
  if (bodyless) {
    return new Response(null, { status, headers: withSummaryHeaders(headers) });
  }
  return summaryJsonResponse({ error: message }, { status, headers });
}
