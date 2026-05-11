import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const POSTS_DIR = path.resolve(process.cwd(), 'posts');
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;
const WINDOWS_RESERVED_BASENAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function pad(number) {
  return String(number).padStart(2, '0');
}

function formatLocalDate(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toYamlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sanitizeFileBaseName(rawTitle) {
  const sanitized = rawTitle
    .replace(INVALID_FILENAME_CHARS, '-')
    .trim()
    .replace(/[. ]+$/g, '');

  if (!sanitized) return 'untitled';
  if (WINDOWS_RESERVED_BASENAMES.test(sanitized)) return `${sanitized}-post`;
  return sanitized;
}

function parseTags(rawTags) {
  const tags = rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return [...new Set(tags)];
}

function buildMarkdown({ title, date, category, tags }) {
  const tagLines = tags.map((tag) => `  - ${toYamlString(tag)}`).join('\n');
  return `---
title: ${toYamlString(title)}
date: ${toYamlString(date)}
categories:
  - ${toYamlString(category)}
tags:
${tagLines}
---

# ${title}
`;
}

async function promptRequired(rl, label) {
  while (true) {
    const input = (await rl.question(`${label}: `)).trim();
    if (input) return input;
    stdout.write(`${label} 不能为空，请重新输入。\n`);
  }
}

async function promptForOverwrite(rl, filePath) {
  while (true) {
    const input = (await rl.question(`文件已存在：${filePath}，是否覆盖？(y/n): `))
      .trim()
      .toLowerCase();

    if (input === 'y' || input === 'yes') return true;
    if (input === 'n' || input === 'no') return false;
    stdout.write('请输入 y 或 n。\n');
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    stdout.write('开始创建新文章...\n');
    const title = await promptRequired(rl, '请输入标题');
    const category = await promptRequired(rl, '请输入分类（单个）');
    const tagsRaw = await promptRequired(rl, '请输入标签（多个用逗号分隔）');
    const tags = parseTags(tagsRaw);

    if (tags.length === 0) {
      stdout.write('标签至少需要一个有效值。\n');
      return;
    }

    await mkdir(POSTS_DIR, { recursive: true });

    const fileBaseName = sanitizeFileBaseName(title);
    const targetPath = path.join(POSTS_DIR, `${fileBaseName}.md`);
    const exists = await fileExists(targetPath);

    if (exists) {
      const shouldOverwrite = await promptForOverwrite(rl, targetPath);
      if (!shouldOverwrite) {
        stdout.write('已取消创建，请更换标题后重试。\n');
        return;
      }
    }

    const date = formatLocalDate(new Date());
    const content = buildMarkdown({
      title,
      date,
      category,
      tags,
    });

    await writeFile(targetPath, content, 'utf8');

    stdout.write('\n文章创建成功。\n');
    stdout.write(`文件路径: ${targetPath}\n`);
    stdout.write(`标题: ${title}\n`);
    stdout.write(`分类: ${category}\n`);
    stdout.write(`标签: ${tags.join(', ')}\n`);
    stdout.write(`日期: ${date}\n`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('创建文章失败：', error);
  process.exitCode = 1;
});
