import { describe, expect, it } from "vitest";

import { decodeHtmlEntities, extractTablesFromMarkdown, PDF_TABLE_LIMITS } from "@/lib/pdf-tables";

describe("decodeHtmlEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeHtmlEntities("a&amp;b&lt;c&gt;&nbsp;¥&#65;&#x41;")).toBe("a&b<c> ¥AA");
  });

  it("keeps unknown entities as-is", () => {
    expect(decodeHtmlEntities("&unknown;")).toBe("&unknown;");
  });
});

describe("extractTablesFromMarkdown", () => {
  it("parses an HTML table with entities, tags, and attributes", () => {
    const markdown = `<html><body><table><tr><th>名称</th><th>金额</th></tr><tr><td><b>苹果</b></td><td>1,234.50</td></tr><tr><td>香蕉<br>批发</td><td>&yen;20</td></tr></table></body></html>`;
    const tables = extractTablesFromMarkdown(markdown);
    expect(tables).toHaveLength(1);
    expect(tables[0].rows).toEqual([
      ["名称", "金额"],
      ["苹果", "1,234.50"],
      ["香蕉 批发", "¥20"],
    ]);
  });

  it("parses a markdown pipe table and skips the separator row", () => {
    const markdown = "前文\n\n| 科目 | 分数 |\n| --- | --- |\n| **数学** | 98 |\n| 语文 | 95 |\n\n后文";
    const tables = extractTablesFromMarkdown(markdown);
    expect(tables).toHaveLength(1);
    expect(tables[0].rows).toEqual([
      ["科目", "分数"],
      ["数学", "98"],
      ["语文", "95"],
    ]);
  });

  it("preserves document order across html and pipe tables", () => {
    const markdown = "开头\n| a | b |\n| - | - |\n| 1 | 2 |\n中间<table><tr><td>x</td></tr></table>结尾";
    const tables = extractTablesFromMarkdown(markdown);
    expect(tables).toHaveLength(2);
    expect(tables[0].rows[0]).toEqual(["a", "b"]);
    expect(tables[1].rows[0]).toEqual(["x"]);
  });

  it("normalizes ragged row widths", () => {
    const tables = extractTablesFromMarkdown("<table><tr><td>a</td><td>b</td></tr><tr><td>c</td></tr></table>");
    expect(tables[0].rows[1]).toEqual(["c", ""]);
  });

  it("returns an empty array when no tables exist", () => {
    expect(extractTablesFromMarkdown("# 纯文本\n没有表格的内容")).toEqual([]);
  });

  it("caps the number of tables", () => {
    const markdown = Array.from({ length: PDF_TABLE_LIMITS.maxTables + 5 }, (_, i) => `<table><tr><td>t${i}</td></tr></table>`).join("\n");
    expect(extractTablesFromMarkdown(markdown)).toHaveLength(PDF_TABLE_LIMITS.maxTables);
  });

  it("separates adjacent pipe tables split by blank lines", () => {
    const markdown = "| a |\n| - |\n| 1 |\n\n| b |\n| - |\n| 2 |";
    const tables = extractTablesFromMarkdown(markdown);
    expect(tables).toHaveLength(2);
  });

  it("handles unbalanced html without infinite loop", () => {
    expect(extractTablesFromMarkdown("<table><tr><td>未闭合")).toEqual([]);
  });
});
