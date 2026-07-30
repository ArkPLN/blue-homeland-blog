import readingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

/**
 * 构建时计算阅读时长与字数，注入 remarkPluginFrontmatter。
 *
 * 通过 import.meta.glob 直接加载的 markdown 模块不导出 remarkPluginFrontmatter，
 * 但该插件会在迁移到 Content Collections 后直接生效（render(entry) 返回值可读取）。
 * 当前页面侧以 compiledContent() 兜底，保证现在就能正确显示。
 */
export function remarkReadingTime() {
  return function (tree, { data }) {
    const text = toString(tree);

    const hanChars = text.match(/\p{Script=Han}/gu)?.length ?? 0;
    const latinWords = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;
    const totalWords = hanChars + latinWords;
    const readingMinutes = Math.max(1, Math.ceil(hanChars / 300 + latinWords / 200));

    data.astro.frontmatter.totalWords = totalWords;
    data.astro.frontmatter.minutesRead = readingMinutes;
  };
}
