// Mermaid 客户端渲染（rehype-mermaid 的 pre-mermaid 策略）。
// 仅当页面存在未渲染的 mermaid 块时动态加载 mermaid，避免无图文章加载 ~2MB。
// 深色主题切换时，用 dark 主题重新渲染。

let mermaidReady: typeof import('mermaid')['default'] | null = null;
let currentIsDark = document.documentElement.classList.contains('dark');

async function loadMermaid() {
  if (mermaidReady) return mermaidReady;
  const mod = await import('mermaid');
  mermaidReady = mod.default;
  mermaidReady.initialize({
    startOnLoad: false,
    theme: currentIsDark ? 'dark' : 'default',
    securityLevel: 'loose',
  });
  return mermaidReady;
}

async function renderMermaid() {
  const blocks = document.querySelectorAll<HTMLElement>('pre.mermaid');
  if (blocks.length === 0) return;

  const mermaid = await loadMermaid();
  // 重置已渲染过的内容，便于深色切换时重新渲染
  blocks.forEach((block) => {
    if (block.dataset.mermaidSource == null) {
      // 反转义 remark 插件里做的 HTML 转义，恢复成 mermaid 源码
      block.dataset.mermaidSource = (block.textContent ?? '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
    }
    block.removeAttribute('data-processed');
    block.textContent = block.dataset.mermaidSource;
  });
  mermaid.initialize({ startOnLoad: false, theme: currentIsDark ? 'dark' : 'default' });
  await mermaid.run({ nodes: Array.from(blocks) });
}

// 主题切换联动
const observer = new MutationObserver(() => {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark !== currentIsDark) {
    currentIsDark = isDark;
    void renderMermaid();
  }
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

// 首次加载
void renderMermaid();