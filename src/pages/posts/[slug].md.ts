import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { formatPostMarkdown } from '../../lib/post-markdown';

export async function getStaticPaths() {
  const entries = await getCollection('posts');
  return entries.map((entry) => ({
    params: { slug: entry.id },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const entries = await getCollection('posts');
  const entry = entries.find((item) => item.id === slug);
  if (!entry) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(formatPostMarkdown(entry), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};
