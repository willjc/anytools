import { describe, expect, it } from "vitest";

import {
  advanceOffset,
  copyCountNeeded,
  fitStaticFontSize,
  marqueeFontSizeOf,
  marqueeSpeedOf,
  marqueeThemeOf,
} from "@/lib/marquee";

describe("marquee config", () => {
  it("resolves theme colors and numeric settings", () => {
    expect(marqueeThemeOf("taxi").color).toBe("#ffd400");
    expect(marqueeSpeedOf("slow")).toBe(90);
    expect(marqueeFontSizeOf("huge")).toBe(220);
  });
});

describe("copyCountNeeded", () => {
  it("needs at least two copies for seamless looping", () => {
    expect(copyCountNeeded(300, 1080)).toBeGreaterThanOrEqual(2);
    expect(copyCountNeeded(2000, 1080)).toBe(2);
  });

  it("covers the viewport for short text", () => {
    expect(copyCountNeeded(100, 1080)).toBe(Math.ceil((1080 + 100) / 100));
  });

  it("guards against zero width", () => {
    expect(copyCountNeeded(0, 1080)).toBe(1);
  });
});

describe("advanceOffset", () => {
  it("moves left and wraps at -spanWidth", () => {
    expect(advanceOffset(0, "left", 180, 1000, 1)).toBe(-180);
    expect(advanceOffset(-1000, "left", 180, 1000, 1)).toBe(-180);
  });

  it("moves right and wraps back below zero", () => {
    expect(advanceOffset(-1000, "right", 180, 1000, 1)).toBe(-820);
    expect(advanceOffset(-50, "right", 180, 1000, 1)).toBeLessThan(0);
  });

  it("returns zero for static mode", () => {
    expect(advanceOffset(123, "static", 180, 1000, 1)).toBe(0);
  });
});

describe("fitStaticFontSize", () => {
  it("shrinks the font until the text fits", () => {
    const measure = (size: number) => text.length * size * 0.5;
    const text = "接机张先生";
    const fitted = fitStaticFontSize(text, 220, measure, 500);
    expect(measure(fitted)).toBeLessThanOrEqual(500);
  });

  it("keeps the base size when it already fits", () => {
    expect(fitStaticFontSize("欢迎", 220, () => 100, 500)).toBe(220);
  });
});
