import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 把任意 YAML 标量(Date/number/boolean/嵌套对象)规整成字符串。
 * undefined 保留为 undefined（保持 optional 语义）。
 */
function asString() {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }, z.string().optional());
}

/**
 * 复刻原 extractSlug 逻辑：取文件名 → 去 .md → decodeURIComponent → % 替换为 -
 * 保持迁移前后文章 URL 逐字一致（含中文文件名与含 % 的边界文章）。
 */
function generateId({ entry }: { entry: string }): string {
  let name = entry.split('/').pop() ?? entry.split('\\').pop() ?? entry;
  name = name.replace(/\.md$/i, '');
  try {
    name = decodeURIComponent(name);
  } catch {
    // 已是解码形式，保持原样
  }
  return name.replace(/%/g, '-');
}

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './posts', generateId }),
  // 全字段 optional + preprocess 统一成 string：兼容历史 frontmatter 极不统一的现状
  schema: z.object({
    title: asString(),
    description: asString(),
    date: asString(),
    updated: asString(),
    cover: asString(),
    categories: z.union([z.array(z.string()), z.string()]).optional(),
    category: z.union([z.array(z.string()), z.string()]).optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    tag: z.union([z.array(z.string()), z.string()]).optional(),
    // 兼容旧字段，不校验不报错
    index_img: asString(),
    banner_img: asString(),
    abbrlink: z.union([z.string(), z.number()]).optional(),
  }),
});

export const collections = { posts: postsCollection };