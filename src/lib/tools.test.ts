import { describe, expect, it } from "vitest";

import { getToolBySlug, getToolsForCategory, tools } from "@/lib/tools";

describe("tool registry", () => {
  it("uses unique stable slugs", () => {
    const slugs = tools.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("looks up tools and groups them by category", () => {
    expect(getToolBySlug("pdf-split")?.name).toBe("PDF 拆分");
    expect(getToolBySlug("missing-tool")).toBeUndefined();
    expect(getToolsForCategory("image").map((tool) => tool.slug)).toEqual([
      "image-compress",
      "image-convert",
    ]);
  });
});
