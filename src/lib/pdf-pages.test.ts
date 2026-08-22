import { describe, expect, it } from "vitest";

import { parsePageSelection } from "@/lib/pdf-pages";

describe("parsePageSelection", () => {
  it("expands ranges and removes duplicate pages", () => {
    expect(parsePageSelection("3, 1-2, 2", 5)).toEqual({ pages: [1, 2, 3] });
  });

  it("rejects malformed ranges", () => {
    expect(parsePageSelection("1;2", 5)).toEqual({ error: "“1;2”不是有效的页码或页码范围。" });
  });

  it("rejects page numbers outside the PDF", () => {
    expect(parsePageSelection("2-6", 5)).toEqual({ error: "页码范围必须在 1 到 5 之间。" });
  });

  it("rejects an empty selection", () => {
    expect(parsePageSelection("  ", 5)).toEqual({ error: "请输入页码，例如 1-3, 5。" });
  });
});
