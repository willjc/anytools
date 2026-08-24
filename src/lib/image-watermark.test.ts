import { describe, expect, it } from "vitest";

import { computeWatermarkAnchor } from "@/lib/image-watermark";

describe("computeWatermarkAnchor", () => {
  it("places bottom-right watermarks with a default margin", () => {
    const anchor = computeWatermarkAnchor({
      imageWidth: 1000,
      imageHeight: 800,
      boxWidth: 200,
      boxHeight: 40,
      position: "bottom-right",
      marginRatio: 0.04,
    });
    expect(anchor).toEqual({ x: 1000 - 32 - 200, y: 800 - 32 - 40 });
  });

  it("centers watermarks regardless of margins", () => {
    const anchor = computeWatermarkAnchor({
      imageWidth: 1000,
      imageHeight: 800,
      boxWidth: 200,
      boxHeight: 40,
      position: "center",
      marginRatio: 0.04,
    });
    expect(anchor).toEqual({ x: 400, y: 380 });
  });

  it("supports all nine positions without leaving the canvas", () => {
    for (const position of ["top-left", "top-center", "top-right", "center", "bottom-left", "bottom-center", "bottom-right"] as const) {
      const anchor = computeWatermarkAnchor({ imageWidth: 500, imageHeight: 400, boxWidth: 100, boxHeight: 30, position, marginRatio: 0.05 });
      expect(anchor.x).toBeGreaterThanOrEqual(0);
      expect(anchor.y).toBeGreaterThanOrEqual(0);
      expect(anchor.x + 100).toBeLessThanOrEqual(500);
      expect(anchor.y + 30).toBeLessThanOrEqual(400);
    }
  });
});
