import type { AstroIntegration } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { postHtmlUrl, postMarkdownUrl } from '../lib/post-markdown';

type SearchIndexItem = {
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
};

type SearchIndexPayload = {
  items: SearchIndexItem[];
};

function toTimestamp(dateValue: string | null): number {
  if (!dateValue) return 0;
  const timestamp = Date.parse(dateValue);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildPostIndexLines(posts: SearchIndexItem[], site: string): string {
  return posts
    .map((post) => {
      const mdUrl = postMarkdownUrl(site, post.slug);
      const htmlUrl = postHtmlUrl(site, post.slug);
      const summary = post.description?.trim() || `HTML: ${htmlUrl}`;
      return `- [${post.title}](${mdUrl}): ${summary}`;
    })
    .join('\n');
}

function injectPostIndex(content: string, postsSection: string): string {
  const postsBlock = `## Posts\n\n${postsSection}`;

  if (content.includes('## Posts')) {
    return content.replace(/## Posts\n\n[\s\S]*?(?=\n## )/, `${postsBlock}\n`);
  }

  const notesMarker = '## Notes';
  if (content.includes(notesMarker)) {
    return content.replace(notesMarker, `${postsBlock}\n\n${notesMarker}`);
  }

  return `${content}\n\n${postsBlock}`;
}

export function llmsPostIndex(): AstroIntegration {
  let site = 'https://arkpln.netlify.app';

  return {
    name: 'llms-post-index',
    hooks: {
      'astro:config:setup': ({ config }) => {
        if (config.site) {
          site = String(config.site);
        }
      },
      'astro:build:done': async ({ dir }) => {
        const distDir = fileURLToPath(dir);
        const llmsPath = path.join(distDir, 'llms.txt');
        const searchIndexPath = path.join(distDir, 'search-index.json');
        const payload = JSON.parse(
          await fs.readFile(searchIndexPath, 'utf-8'),
        ) as SearchIndexPayload;
        const posts = [...payload.items].sort(
          (a, b) => toTimestamp(b.date) - toTimestamp(a.date),
        );
        const postsSection = buildPostIndexLines(posts, site);
        const existing = await fs.readFile(llmsPath, 'utf-8');
        const updated = injectPostIndex(existing, postsSection);

        await fs.writeFile(llmsPath, updated, 'utf-8');
        console.log(`✅ llms.txt updated with ${posts.length} post indexes`);
      },
    },
  };
}
