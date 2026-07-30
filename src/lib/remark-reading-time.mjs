import { toString } from 'mdast-util-to-string';

/**
 * 构建时计算阅读时长与字数，注入 remarkPluginFrontmatter。
 *
 * Content Collections 下 render(entry) 返回的 remarkPluginFrontmatter
 * 可直接读取 totalWords / minutesRead。
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