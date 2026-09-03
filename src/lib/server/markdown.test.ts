import { describe, expect, it } from "vitest";

import { markdownToHtml } from "@/lib/server/markdown";

describe("markdownToHtml", () => {
  it("keeps common Markdown but neutralizes active HTML and remote images", () => {
    const html = markdownToHtml("# 标题\n\n<script>alert(1)</script>\n\n![私密图](https://example.com/a.png)\n\n[危险](javascript:alert(1))");

    expect(html).toContain("<h1>标题</h1>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("[图片：私密图]");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("href=\"javascript:");
  });
});
