import { describe, expect, it } from "vitest";

import { fitCropRect } from "@/lib/image-crop";

describe("fitCropRect", () => {
  it("returns the largest centered rect for a wider target ratio", () => {
    const rect = fitCropRect({ imageWidth: 1000, imageHeight: 500, ratioWidth: 16, ratioHeight: 9 });
    expect(rect.width).toBeCloseTo(888.89, 1);
    expect(rect.height).toBeCloseTo(500);
    expect(rect.x).toBeCloseTo(55.56, 1);
    expect(rect.y).toBe(0);
  });

  it("limits by width when the target is taller", () => {
    expect(fitCropRect({ imageWidth: 600, imageHeight: 1200, ratioWidth: 3, ratioHeight: 4 })).toEqual({
      x: 0,
      y: 200,
      width: 600,
      height: 800,
    });
  });

  it("falls back to the full image for free cropping", () => {
    expect(fitCropRect({ imageWidth: 640, imageHeight: 480, ratioWidth: 0, ratioHeight: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 640,
      height: 480,
    });
  });
});
