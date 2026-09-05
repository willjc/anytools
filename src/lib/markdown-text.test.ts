import { describe, expect, it } from "vitest";

import { markdownToPlainText } from "@/lib/markdown-text";

describe("markdownToPlainText", () => {
  it("strips headings, emphasis, and link syntax but keeps text", () => {
    const input = "## 业绩亮点\n\n**营收** 增长 *20%*，详见[季度报告](https://example.com/report)。";
    expect(markdownToPlainText(input)).toBe("业绩亮点\n\n营收 增长 20%，详见季度报告。");
  });

  it("drops images without text and keeps alt text when present", () => {
    expect(markdownToPlainText("前文\n\n![](https://example.com/a.png)\n\n![签名](sig.png)")).toBe("前文\n\n签名");
  });

  it("keeps fenced code content without the markers", () => {
    expect(markdownToPlainText("```js\nconst a = 1;\n```")).toBe("const a = 1;");
  });

  it("flattens table pipes and removes separator rows", () => {
    const input = "| 名称 | 数量 |\n| --- | --- |\n| 苹果 | 3 |";
    expect(markdownToPlainText(input)).toBe("名称  数量\n苹果  3");
  });

  it("removes blockquote markers and horizontal rules", () => {
    const input = "> 引用内容\n\n---\n\n正文";
    expect(markdownToPlainText(input)).toBe("引用内容\n\n正文");
  });

  it("keeps list content and collapses extra blank lines", () => {
    const input = "- 第一条\n- 第二条\n\n\n\n1. 待办一\n2. 待办二";
    expect(markdownToPlainText(input)).toBe("第一条\n第二条\n\n待办一\n待办二");
  });

  it("normalizes CRLF line endings", () => {
    expect(markdownToPlainText("第一行\r\n第二行")).toBe("第一行\n第二行");
  });
});
