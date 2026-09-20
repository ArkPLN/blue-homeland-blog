import { beforeEach, describe, expect, it, vi } from 'vitest';
import summaryGuard from '../netlify/edge-functions/summary-guard';

function canonicalUrl(slug: string): string {
  return `https://example.com/api/summary?${new URLSearchParams({ slug })}`;
}

describe('summaryGuard', () => {
  const next = vi.fn();

  beforeEach(() => {
    next.mockReset();
    next.mockResolvedValue(new Response('next'));
  });

  it('continues the request chain once for a valid GET', async () => {
    const response = await summaryGuard(new Request(canonicalUrl('post')), {
      next,
    });

    expect(next).toHaveBeenCalledTimes(1);
    await expect(response.text()).resolves.toBe('next');
  });

  it.each([
    new Request(canonicalUrl('post'), { method: 'HEAD' }),
    new Request(canonicalUrl('post'), { method: 'POST' }),
    new Request('https://example.com/api/summary?slug=post&v=1'),
    new Request('https://example.com/api/summary?slug=post&slug=other'),
  ])('blocks invalid requests before the cache and origin', async (request) => {
    const response = await summaryGuard(request, { next });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(next).not.toHaveBeenCalled();
  });
});
