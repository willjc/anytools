import { marked, Renderer } from "marked";

const renderer = new Renderer();

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

renderer.html = ({ text }) => escapeHtml(text);
renderer.image = ({ text }) => `<span>[图片：${escapeHtml(text || "未命名")}]</span>`;
renderer.link = function ({ href, title, tokens }) {
  const label = this.parser.parseInline(tokens);
  if (!/^(https?:|mailto:)/i.test(href)) return label;
  const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
  return `<a href="${escapeHtml(href)}"${safeTitle}>${label}</a>`;
};

export function markdownToHtml(markdown: string): string {
  const body = marked.parse(markdown.replace(/^\uFEFF/, ""), { async: false, renderer });
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
body{font-family:"Noto Sans CJK SC","Microsoft YaHei",sans-serif;line-height:1.65;color:#21201c;max-width:800px;margin:40px auto;padding:0 24px}
h1,h2,h3,h4{line-height:1.3;margin:1.4em 0 .6em}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d4d0c9;padding:8px;text-align:left}blockquote{border-left:4px solid #d4d0c9;margin-left:0;padding-left:16px;color:#5f5d56}code,pre{font-family:monospace;background:#f1efec}code{padding:2px 4px}pre{padding:12px;white-space:pre-wrap}img{max-width:100%}
</style>
</head>
<body>${body}</body>
</html>`;
}
