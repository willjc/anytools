import { describe, expect, it } from "vitest";

import { renderMarkdownToHtml } from "@/lib/markdown-preview";

describe("renderMarkdownToHtml", () => {
  it("renders headings, lists and inline syntax", () => {
    const html = renderMarkdownToHtml("# 标题\n\n- 一\n- 二\n\n**粗体** 与 `代码`");

    expect(html).toContain("<h1>标题</h1>");
    expect(html).toContain("<li>一</li>");
    expect(html).toContain("<strong>粗体</strong>");
    expect(html).toContain("<code>代码</code>");
  });

  it("renders GFM tables", () => {
    const html = renderMarkdownToHtml("| 名称 | 数量 |\n| --- | --- |\n| 苹果 | 2 |");

    expect(html).toContain("<table>");
    expect(html).toContain("<th>名称</th>");
    expect(html).toContain("<td>苹果</td>");
  });

  it("returns an empty string for blank input", () => {
    expect(renderMarkdownToHtml("")).toBe("");
    expect(renderMarkdownToHtml("   \n  ")).toBe("");
  });
});

describe("renderMarkdownToHtml safety", () => {
  it("escapes raw HTML blocks instead of rendering them", () => {
    const html = renderMarkdownToHtml("<script>alert(1)</script>");

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes inline HTML tags", () => {
    const html = renderMarkdownToHtml("前 <b>粗</b> 后");

    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
  });

  it("drops links with unsafe protocols but keeps the label", () => {
    const html = renderMarkdownToHtml("[点我](javascript:alert)");

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
    expect(html).toContain("点我");
  });

  it("blocks upper-case and data: link protocols", () => {
    expect(renderMarkdownToHtml("[x](JaVaScRiPt:alert)")).not.toContain("<a ");
    expect(renderMarkdownToHtml("[x](data:text/html;base64,PHNjcmlwdD4=)")).not.toContain("<a ");
  });

  it("keeps http, mailto and relative links", () => {
    const html = renderMarkdownToHtml(
      "[站点](https://example.com) [邮件](mailto:a@b.com) [文档](./doc.md)",
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="mailto:a@b.com"');
    expect(html).toContain('href="./doc.md"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("allows remote and inline images but rejects unsafe sources", () => {
    expect(renderMarkdownToHtml("![图](https://example.com/a.png)")).toContain(
      'referrerpolicy="no-referrer"',
    );
    expect(renderMarkdownToHtml("![图](data:image/png;base64,iVBORw0KGgo=)")).toContain("<img ");

    const blocked = renderMarkdownToHtml("![图](javascript:alert)");
    expect(blocked).not.toContain("<img");
    expect(blocked).toContain("图");
  });

  it("escapes code block contents", () => {
    const html = renderMarkdownToHtml("```\n<script>alert(1)</script>\n```");

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
