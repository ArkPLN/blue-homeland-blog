import { describe, expect, it } from 'vitest';
import {
  summaryErrorResponse,
  validateSummaryRequest,
} from '../netlify/shared/summary-request';

function canonicalUrl(slug: string): string {
  return `https://example.com/api/summary?${new URLSearchParams({ slug })}`;
}

describe('validateSummaryRequest', () => {
  it('accepts one canonical slug parameter', () => {
    const result = validateSummaryRequest(
      new Request(canonicalUrl('RAG技术解析 · 实战')),
    );

    expect(result).toMatchObject({ ok: true, slug: 'RAG技术解析 · 实战' });
  });

  it.each(['HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])(
    'rejects %s requests',
    (method) => {
      const result = validateSummaryRequest(
        new Request(canonicalUrl('post'), { method }),
      );
      expect(result).toEqual({
        ok: false,
        message: 'Method not allowed',
        status: 405,
      });
    },
  );

  it.each([
    'https://example.com/api/summary',
    'https://example.com/api/summary?slug=',
    'https://example.com/api/summary?slug=post&v=1',
    'https://example.com/api/summary?slug=post&zzz=1',
    'https://example.com/api/summary?slug=post&slug=other',
    'https://example.com/api/summary?other=post',
    'https://example.com/api/summary?slug=hello%20world',
  ])('rejects a non-canonical query: %s', (url) => {
    expect(validateSummaryRequest(new Request(url)).ok).toBe(false);
  });

  it.each([
    ' leading',
    'trailing ',
    'a/b',
    'a\\b',
    'a\u0000b',
    'x'.repeat(161),
  ])('rejects an invalid slug', (slug) => {
    const result = validateSummaryRequest(new Request(canonicalUrl(slug)));
    expect(result).toMatchObject({
      ok: false,
      message: 'Invalid slug',
      status: 400,
    });
  });
});

describe('summaryErrorResponse', () => {
  it('returns consistent no-store JSON headers and Allow for 405', async () => {
    const response = summaryErrorResponse('Method not allowed', 405);

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('netlify-vary')).toBe('query=slug');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    await expect(response.json()).resolves.toEqual({
      error: 'Method not allowed',
    });
  });

  it('returns a bodyless 405 suitable for HEAD requests', async () => {
    const response = summaryErrorResponse('Method not allowed', 405, true);

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
    expect(response.headers.get('netlify-vary')).toBe('query=slug');
    await expect(response.text()).resolves.toBe('');
  });
});
