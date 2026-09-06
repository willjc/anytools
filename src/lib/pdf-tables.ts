/**
 * 从 MinerU 输出的 Markdown 中提取表格。
 * MinerU 对表格通常输出 HTML <table>，简单表格也可能输出 Markdown 管道表格；
 * 本模块按文档顺序解析两者，规整为等宽行列表。
 */

export const PDF_TABLE_LIMITS = {
  maxTables: 30,
  maxRowsPerTable: 1000,
  maxCellChars: 400,
} as const;

export type PdfTable = { rows: string[][] };

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  times: "×",
  yen: "¥",
};

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      const point = parseInt(code.slice(2), 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : whole;
    }
    if (code.startsWith("#")) {
      const point = parseInt(code.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : whole;
    }
    return ENTITY_MAP[code.toLowerCase()] ?? whole;
  });
}

function cleanCell(raw: string): string {
  const text = raw
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ");
  const decoded = decodeHtmlEntities(text);
  return decoded.replace(/\s+/g, " ").trim().slice(0, PDF_TABLE_LIMITS.maxCellChars);
}

function parseHtmlTable(block: string): PdfTable | null {
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[][] = [];
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowPattern.exec(block)) !== null) {
    const cells: string[] = [];
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
      const value = cleanCell(cellMatch[1]);
      if (value || cellMatch[1].trim() !== "") cells.push(value);
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return null;
  return { rows: normalizeWidths(rows) };
}

function normalizeWidths(rows: string[][]): string[][] {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => (row.length === width ? row : [...row, ...Array(width - row.length).fill("")]));
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePipeTable(lines: string[]): PdfTable | null {
  const rows: string[][] = [];
  for (const line of lines) {
    if (/^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-")) continue;
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    const cells = trimmed.split(/(?<!\\)\|/).map((cell) => cleanCell(stripInlineMarkdown(cell.replace(/\\\|/g, "|"))));
    if (cells.some((cell) => cell !== "")) rows.push(cells);
  }
  if (rows.length === 0) return null;
  return { rows: normalizeWidths(rows) };
}

/** 按文档顺序提取全部表格（HTML 表格优先于管道表格判定）。 */
export function extractTablesFromMarkdown(markdown: string): PdfTable[] {
  const cleaned = markdown.replace(/```(?:html|markdown)?\n/gi, "```").replace(/```/g, "");
  const tables: PdfTable[] = [];
  let cursor = 0;

  while (cursor < cleaned.length && tables.length < PDF_TABLE_LIMITS.maxTables) {
    const htmlIndex = cleaned.toLowerCase().indexOf("<table", cursor);
    const lineEnd = cleaned.indexOf("\n", cursor);
    const pipeCandidate = cleaned.slice(cursor, lineEnd === -1 ? cleaned.length : lineEnd);
    const pipeIndex = /^\s*\|.*\|/.test(pipeCandidate) ? cursor : cleaned.slice(cursor).search(/\n\s*\|.*\|/) >= 0 ? cursor + cleaned.slice(cursor).indexOf("\n|") + 1 : -1;

    if (htmlIndex === -1 && pipeIndex === -1) break;

    if (htmlIndex !== -1 && (pipeIndex === -1 || htmlIndex <= pipeIndex)) {
      const end = cleaned.toLowerCase().indexOf("</table>", htmlIndex);
      if (end === -1) break;
      const table = parseHtmlTable(cleaned.slice(htmlIndex, end + 8));
      if (table) tables.push(table);
      cursor = end + 8;
    } else {
      // 收集连续的管道行
      let end = pipeIndex;
      while (end < cleaned.length) {
        const nextLineEnd = cleaned.indexOf("\n", end);
        const line = cleaned.slice(end, nextLineEnd === -1 ? cleaned.length : nextLineEnd);
        if (!/^\s*\|.*\|/.test(line)) break;
        end = nextLineEnd === -1 ? cleaned.length : nextLineEnd + 1;
      }
      const table = parsePipeTable(cleaned.slice(pipeIndex, end).split("\n"));
      if (table) tables.push(table);
      cursor = end;
    }
  }

  return tables.map((table) => ({ rows: table.rows.slice(0, PDF_TABLE_LIMITS.maxRowsPerTable) })).filter((table) => table.rows.length > 0);
}
