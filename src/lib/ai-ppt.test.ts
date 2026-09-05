import { describe, expect, it } from "vitest";

import {
  buildDeckSystemPrompt,
  buildDeckUserPrompt,
  clampInput,
  clampSlideCount,
  normalizeSlide,
  parseDeckLine,
  PPT_LIMITS,
} from "@/lib/ai-ppt";

describe("slide parsing", () => {
  it("keeps the first object as deck meta when it looks like a cover", () => {
    const parsed = parseDeckLine('{"layout":"cover","title":"季度复盘","subtitle":"Q3"}');
    expect(parsed?.kind).toBe("meta");
    if (parsed?.kind === "meta") {
      expect(parsed.meta.title).toBe("季度复盘");
      expect(parsed.meta.subtitle).toBe("Q3");
    }
  });

  it("parses content slides and coerces unknown layouts", () => {
    const parsed = parseDeckLine('{"layout":"grid","title":"业绩亮点","bullets":["增长 20%","成本下降"],"notes":"强调数据"}');
    expect(parsed?.kind).toBe("slide");
    if (parsed?.kind === "slide") {
      expect(parsed.slide.layout).toBe("content");
      expect(parsed.slide.bullets).toEqual(["增长 20%", "成本下降"]);
      expect(parsed.slide.notes).toBe("强调数据");
    }
  });

  it("rejects malformed or empty slides", () => {
    expect(parseDeckLine("not json")).toBeNull();
    expect(parseDeckLine('{"title":"无要点"}')).toBeNull();
    expect(parseDeckLine('{"layout":"content","title":"  "}')).toBeNull();
    expect(parseDeckLine("[]")).toBeNull();
  });

  it("normalizes via normalizeSlide with caps", () => {
    const slide = normalizeSlide({
      layout: "content",
      title: "  标  题  ",
      bullets: ["a", 42, "   ", "b", "c", "d", "e", "f"],
      body: "正文",
    });
    expect(slide?.title).toBe("标 题");
    expect(slide?.bullets).toHaveLength(PPT_LIMITS.maxBulletsPerSlide);
  });

  it("requires bullets or body for content layout", () => {
    expect(normalizeSlide({ layout: "content", title: "标题" })).toBeNull();
    expect(normalizeSlide({ layout: "closing", title: "谢谢" })).not.toBeNull();
    expect(normalizeSlide({ layout: "section", title: "章节" })).not.toBeNull();
  });
});

describe("request clamping", () => {
  it("clamps slide count into range", () => {
    expect(clampSlideCount(999)).toBe(PPT_LIMITS.maxSlideCount);
    expect(clampSlideCount(1)).toBe(PPT_LIMITS.minSlideCount);
    expect(clampSlideCount("abc")).toBe(PPT_LIMITS.defaultSlideCount);
    expect(clampSlideCount(8.4)).toBe(8);
  });

  it("trims and caps input", () => {
    expect(clampInput("  你好  ")).toBe("你好");
    expect(clampInput("x".repeat(PPT_LIMITS.maxInputChars + 100))).toHaveLength(PPT_LIMITS.maxInputChars);
    expect(clampInput(42)).toBe("");
  });
});

describe("prompts", () => {
  it("states JSON Lines rule and target page count", () => {
    const system = buildDeckSystemPrompt(10);
    expect(system).toContain("JSON Lines");
    expect(system).toContain("10 行");
    const user = buildDeckUserPrompt("季度销售汇报", 10, "管理层季度会");
    expect(user).toContain("季度销售汇报");
    expect(user).toContain("管理层季度会");
  });
});
