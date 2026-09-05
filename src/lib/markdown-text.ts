/**
 * 把 MinerU 输出的 Markdown 转为可读的纯文本（用于「图片转文字」）。
 * 保留正文、列表与表格内容的可读性，去除排版语法符号。
 */

function stripInlineSyntax(line: string): string {
  return line
    // 图片：无意义时丢弃，有 alt 文本时保留
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    // 链接保留文字
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // 行内代码、加粗、斜体
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1");
}

export function markdownToPlainText(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  let inFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      output.push(rawLine);
      continue;
    }

    // 分隔行 / 水平线
    if (/^\s*(\|?[\s:|-]+\|[\s:|-]*|\*\s*\*\s*\*|-{3,}|_{3,})\s*$/.test(line)) {
      continue;
    }

    let text = line;
    // 标题、引用、列表标记
    text = text.replace(/^\s{0,3}#{1,6}\s+/, "");
    text = text.replace(/^\s{0,3}>\s?/, "");
    text = text.replace(/^(\s{0,3})([-*+]|\d+[.)])\s+/, "$1");

    // 表格行：拆出单元格逐个去空格，再用两个空格连接便于阅读
    if (/^\s*\|.*\|\s*$/.test(text)) {
      const cells = text
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());
      text = cells.join("  ");
    }

    output.push(stripInlineSyntax(text).trimEnd());
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
