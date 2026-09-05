import { describe, expect, it } from "vitest";

import { getToolBySlug, getToolsForCategory, toolCategories, tools } from "@/lib/tools";

describe("tool registry", () => {
  it("uses unique stable slugs", () => {
    const slugs = tools.map((tool) => tool.slug);
    expect(tools).toHaveLength(34);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("looks up tools and groups them by category", () => {
    expect(getToolBySlug("pdf-split")?.name).toBe("PDF 拆分");
    expect(getToolBySlug("missing-tool")).toBeUndefined();
    expect(getToolsForCategory("image").map((tool) => tool.slug)).toEqual([
      "image-compress",
      "image-convert",
      "image-crop",
      "image-watermark",
      "image-stitch",
      "image-grid",
      "heic-to-jpg",
      "image-resize",
      "image-redact",
    ]);
  });

  it("covers every declared category and keeps SEO fields filled", () => {
    const usedCategories = new Set(tools.map((tool) => tool.category));
    for (const category of toolCategories) {
      expect(usedCategories.has(category.id)).toBe(true);
    }
    for (const tool of tools) {
      expect(tool.keywords.length).toBeGreaterThan(0);
      expect(tool.longDescription.length).toBeGreaterThan(0);
      expect(["browser", "cloud"]).toContain(tool.processing);
      expect(tool.availability).toBe("ready");
    }
  });
});
