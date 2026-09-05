import { describe, expect, it } from "vitest";

import type { Slide } from "@/lib/ai-ppt";
import { buildPptx } from "@/lib/server/pptx";

const slides: Slide[] = [
  { layout: "section", title: "市场回顾" },
  { layout: "content", title: "业绩亮点", bullets: ["营收增长 20%", "新客占比提升"], notes: "备注内容" },
  { layout: "content", title: "下一季度计划", body: "聚焦重点行业客户。" },
  { layout: "closing", title: "谢谢观看", body: "欢迎提问。" },
];

describe("pptx builder", () => {
  it("renders a non-empty pptx archive", async () => {
    const bytes = await buildPptx({ title: "季度复盘", subtitle: "2026 Q3" }, slides);
    const header = Buffer.from(bytes.slice(0, 2)).toString();
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(header).toBe("PK");
  });

  it("supports an empty deck (cover only)", async () => {
    const bytes = await buildPptx({ title: "空白演示" }, []);
    expect(bytes.length).toBeGreaterThan(10_000);
  });
});
