import type { APIRoute } from 'astro';
import { getSearchIndexPayload } from '../lib/search';

export const GET: APIRoute = async () => {
  const payload = await getSearchIndexPayload();

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
