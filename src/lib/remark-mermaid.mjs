/**
 * remark 插件：把 ```mermaid fenced 代码块转成 <pre class="mermaid"> 原始 HTML 节点。
 *
 * 自行实现等价于 rehype-mermaid 的 pre-mermaid 策略，但只做"占位"：
 * 真正的 mermaid 渲染交给客户端 mermaid-init.ts 运行时完成。
 * 这样构建时完全不依赖 mermaid-isomorphic / playwright（Netlify 构建零负担）。
 *
 * 在 remark 阶段(而非 rehype)处理：转成 html 类型节点后，
 * 后续 mdast→hast 与 shiki 代码高亮不会再把它当代码块高亮。
 */
export function remarkMermaidToHtml() {
  return (tree) => {
    const visit = (node) => {
      if (!node) return;
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (
            child.type === 'code' &&
            (child.lang === 'mermaid' || child.lang === 'mermaid.js')
          ) {
            const source = String(child.value ?? '');
            // 转义 </>  防止 raw HTML 里的内容提前闭合，但保留源码给客户端 mermaid 解析
            const escaped = source
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            node.children[i] = {
              type: 'html',
              value: `<pre class="mermaid">\n${escaped}\n</pre>`,
            };
          }
          visit(child);
        }
      }
    };
    visit(tree);
  };
}