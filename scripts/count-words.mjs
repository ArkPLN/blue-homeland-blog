#!/usr/bin/env node
/**
 * 博客 Markdown 有效字数统计
 *
 * 输出两套口径（每个 .md 剔除 YAML frontmatter 后解析）：
 *
 *  A. 正文有效字数（推荐）
 *     汉字数 + 英文词数，排除代码块 / 行内代码 / 图片 alt / 原始 HTML / 链接 URL。
 *     反映「读者真正要读的中英文内容量」。
 *
 *  B. 站内口径
 *     精确复现 src/lib/remark-reading-time.mjs 的 totalWords：mdast AST → toString →
 *     汉字 + 英文词，包含代码块与图片 alt，即文章页「预计阅读 N 分钟」所依据的数字。
 *
 * 用法: npm run count
 */
import fs from 'node:fs'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { toString } from 'mdast-util-to-string'

const POSTS_DIR = path.resolve(process.cwd(), 'posts')

const HAN = /\p{Script=Han}/gu
const WORD = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g

const count = (text) => ({
  han: (text.match(HAN) || []).length,
  word: (text.match(WORD) || []).length,
})

const stripFrontmatter = (raw) => {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return m ? raw.slice(m[0].length) : raw
}

/** 解析一次，产出两种口径所需的文本 */
function analyze(md) {
  const tree = unified().use(remarkParse).parse(md)

  const prose = [] // 正文
  const code = [] // 代码块 + 行内代码
  let codeLines = 0

  const walk = (node) => {
    switch (node.type) {
      case 'code':
        code.push(node.value)
        codeLines += node.value.split('\n').filter((l) => l.trim()).length
        return
      case 'inlineCode':
        code.push(node.value)
        return
      case 'image': // alt 不算正文
      case 'html': // 原始 HTML 源码不算正文
        return
      case 'text':
        prose.push(node.value)
        return
      default:
        for (const child of node.children ?? []) walk(child)
    }
  }
  walk(tree)

  return {
    proseText: prose.join('\n'),
    codeText: code.join('\n'),
    fullText: toString(tree), // 站内口径：AST 全文，含代码/alt/HTML 源码
    codeLines,
  }
}

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'))

const rows = []
let t = { han: 0, word: 0, site: 0, codeLines: 0, codeHan: 0, codeWord: 0 }

for (const file of files) {
  const md = stripFrontmatter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'))
  const { proseText, codeText, fullText, codeLines } = analyze(md)

  const p = count(proseText)
  const c = count(codeText)
  const site = count(fullText)

  rows.push({
    name: file.replace(/\.md$/, ''),
    han: p.han,
    word: p.word,
    effective: p.han + p.word,
    site: site.han + site.word,
    codeLines,
    minutes: Math.max(1, Math.ceil(site.han / 300 + site.word / 200)),
  })

  t.han += p.han
  t.word += p.word
  t.site += site.han + site.word
  t.codeLines += codeLines
  t.codeHan += c.han
  t.codeWord += c.word
}

rows.sort((a, b) => b.effective - a.effective)

const pad = (s, n, right = false) => {
  const w = [...String(s)].reduce((acc, ch) => acc + (ch.charCodeAt(0) > 0x2e80 ? 2 : 1), 0)
  return right ? ' '.repeat(Math.max(0, n - w)) + s : s + ' '.repeat(Math.max(0, n - w))
}

const L = 56
console.log('博客 Markdown 有效字数统计（正文口径：不含代码块 / 图片 alt / 原始 HTML）')
console.log('='.repeat(112))
console.log(
  pad('文章', L) + pad('汉字', 9, true) + pad('英文词', 9, true) + pad('有效字数', 11, true) + pad('站内口径', 11, true) + pad('代码行', 9, true) + pad('阅读', 7, true),
)
console.log('-'.repeat(112))
for (const r of rows) {
  console.log(
    pad(r.name, L) +
      pad(r.han.toLocaleString(), 9, true) +
      pad(r.word.toLocaleString(), 9, true) +
      pad(r.effective.toLocaleString(), 11, true) +
      pad(r.site.toLocaleString(), 11, true) +
      pad(r.codeLines.toLocaleString(), 9, true) +
      pad(`${r.minutes}分`, 7, true),
  )
}
console.log('-'.repeat(112))
console.log(
  pad(`合计（${rows.length} 篇）`, L) +
    pad(t.han.toLocaleString(), 9, true) +
    pad(t.word.toLocaleString(), 9, true) +
    pad((t.han + t.word).toLocaleString(), 11, true) +
    pad(t.site.toLocaleString(), 11, true) +
    pad(t.codeLines.toLocaleString(), 9, true),
)
console.log('='.repeat(112))
console.log(`
正文有效字数（汉字 + 英文词）: ${(t.han + t.word).toLocaleString()}
  ├─ 汉字      : ${t.han.toLocaleString()}
  └─ 英文词    : ${t.word.toLocaleString()}
站内口径总字数（含代码块）  : ${t.site.toLocaleString()}
  └─ 其中代码块贡献          : ${(t.site - t.han - t.word).toLocaleString()}（汉字 ${t.codeHan.toLocaleString()} + 英文词 ${t.codeWord.toLocaleString()}）
代码总行数                  : ${t.codeLines.toLocaleString()}
平均每篇正文有效字数        : ${Math.round((t.han + t.word) / rows.length).toLocaleString()}
`)
