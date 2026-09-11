/**
 * 把粘贴进来的 Markdown 渲染为可安全插入预览区的 HTML。
 *
 * 全部在浏览器本地完成，不发起网络请求。预览区用 dangerouslySetInnerHTML
 * 直接插入这里返回的字符串，因此渲染时遵守以下约定：
 *
 * - Markdown 里的原始 HTML 一律转义成纯文本，不参与渲染；
 * - 链接只保留 http / https / mailto / tel 与站内相对地址，其余协议降级为纯文本；
 * - 图片只保留 http / https 与内联的 data:image/，其余降级为替代文字；
 * - 远程图片带 referrerpolicy="no-referrer"，避免向图床泄露当前页面地址。
 */

import { Marked, type RendererObject } from "marked";

const HTML_ESCAPES: readonly (readonly [RegExp, string])[] = [
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
  [/"/g, "&quot;"],
  [/'/g, "&#39;"],
];

function escapeHtml(value: string): string {
  let escaped = value;
  for (const [pattern, replacement] of HTML_ESCAPES) {
    escaped = escaped.replace(pattern, replacement);
  }
  return escaped;
}

/**
 * 去掉控制字符与空白后再判断协议，避免 "java\nscript:" 这类绕过写法。
 * 只用于安全判断，实际输出仍使用原始地址。
 */
function normalizeUrl(url: string): string {
  return url.replace(/[\u0000-\u0020\u007f]+/g, "").toLowerCase();
}

/** 相对地址、锚点与查询串没有协议头，视为安全。 */
function hasExplicitScheme(normalized: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/.test(normalized);
}

function isSafeLinkUrl(href: string): boolean {
  const normalized = normalizeUrl(href);
  if (!normalized) return false;
  if (!hasExplicitScheme(normalized)) return true;
  return /^(?:https?|mailto|tel):/.test(normalized);
}

function isSafeImageUrl(src: string): boolean {
  const normalized = normalizeUrl(src);
  if (!normalized) return false;
  if (/^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,/.test(normalized)) return true;
  if (!hasExplicitScheme(normalized)) return true;
  return /^https?:/.test(normalized);
}

function buildTitleAttribute(title: string | null | undefined): string {
  return title ? ` title="${escapeHtml(title)}"` : "";
}

const markdownRenderer: RendererObject = {
  // 原始 HTML 不参与渲染，一律作为文字显示。
  html({ text }) {
    return escapeHtml(text);
  },

  link({ href, title, tokens }) {
    const label = this.parser.parseInline(tokens);
    if (!isSafeLinkUrl(href)) {
      return label;
    }
    return `<a href="${escapeHtml(href)}"${buildTitleAttribute(title)} target="_blank" rel="noopener noreferrer">${label}</a>`;
  },

  image({ href, title, text }) {
    if (!isSafeImageUrl(href)) {
      return escapeHtml(text || href);
    }
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text ?? "")}"${buildTitleAttribute(title)} loading="lazy" referrerpolicy="no-referrer" />`;
  },
};

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: markdownRenderer,
});

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown.trim()) return "";
  // 未启用 async，parse 同步返回字符串。
  return marked.parse(markdown) as string;
}
