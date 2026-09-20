import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createOpenAICompatible: vi.fn(),
  fetch: vi.fn(),
  generateText: vi.fn(),
  model: vi.fn(),
}));

vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: mocks.createOpenAICompatible,
}));
vi.mock('ai', () => ({ generateText: mocks.generateText }));

import handler from '../netlify/functions/summary.mts';

function canonicalUrl(slug: string): string {
  return `https://example.com/api/summary?${new URLSearchParams({ slug })}`;
}

describe('summary function', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', mocks.fetch);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    process.env.SILICONFLOW_API_KEY = 'test-key';
    mocks.createOpenAICompatible.mockReturnValue(mocks.model);
    mocks.model.mockReturnValue('test-model');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.SILICONFLOW_API_KEY;
  });

  it('rejects invalid input without fetching or calling the model', async () => {
    const response = await handler(
      new Request('https://example.com/api/summary?slug=post&v=1'),
    );

    expect(response.status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('returns 405 with Allow without downstream work', async () => {
    const response = await handler(
      new Request(canonicalUrl('post'), { method: 'HEAD' }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
    await expect(response.text()).resolves.toBe('');
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('returns 404 when the post does not exist', async () => {
    mocks.fetch.mockResolvedValue(new Response('missing', { status: 404 }));

    const response = await handler(new Request(canonicalUrl('missing')));

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('returns 502 when the post source cannot be loaded', async () => {
    mocks.fetch.mockResolvedValue(new Response('failed', { status: 503 }));

    const response = await handler(new Request(canonicalUrl('post')));

    expect(response.status).toBe(502);
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('returns 504 when an upstream operation times out', async () => {
    const timeout = new Error('timed out');
    timeout.name = 'TimeoutError';
    mocks.fetch.mockRejectedValue(timeout);

    const response = await handler(new Request(canonicalUrl('post')));

    expect(response.status).toBe(504);
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('returns 502 when model generation fails', async () => {
    mocks.fetch.mockResolvedValue(new Response('# article'));
    mocks.generateText.mockRejectedValue(new Error('provider unavailable'));

    const response = await handler(new Request(canonicalUrl('post')));

    expect(response.status).toBe(502);
    expect(mocks.generateText).toHaveBeenCalledTimes(1);
  });

  it('normalizes the summary and returns bounded cache headers', async () => {
    mocks.fetch.mockResolvedValue(new Response('# article'));
    mocks.generateText.mockResolvedValue({
      text: ' 摘要\n  内容 ',
      usage: { inputTokens: 10, outputTokens: 4, totalTokens: 14 },
    });

    const response = await handler(new Request(canonicalUrl('post')));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ summary: '摘要 内容' });
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, must-revalidate',
    );
    expect(response.headers.get('netlify-cdn-cache-control')).toBe(
      'public, durable, max-age=31536000',
    );
    expect(response.headers.get('netlify-vary')).toBe('query=slug');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.generateText).toHaveBeenCalledTimes(1);
  });
});
