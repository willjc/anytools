import { describe, expect, it } from "vitest";

import { calculateResizeDimensions, isResizeBatchTooLarge } from "@/lib/image-resize";

describe("calculateResizeDimensions", () => {
  it("keeps the source ratio when resizing by width or height", () => {
    expect(calculateResizeDimensions({ sourceWidth: 4000, sourceHeight: 3000, mode: "width", targetWidth: 1200, targetHeight: 1, keepAspect: true })).toEqual({ width: 1200, height: 900 });
    expect(calculateResizeDimensions({ sourceWidth: 4000, sourceHeight: 3000, mode: "height", targetWidth: 1, targetHeight: 600, keepAspect: true })).toEqual({ width: 800, height: 600 });
  });

  it("fits an exact box when proportional scaling is enabled", () => {
    expect(calculateResizeDimensions({ sourceWidth: 4000, sourceHeight: 3000, mode: "exact", targetWidth: 1000, targetHeight: 1000, keepAspect: true })).toEqual({ width: 1000, height: 750 });
  });

  it("uses the exact dimensions when proportional scaling is disabled", () => {
    expect(calculateResizeDimensions({ sourceWidth: 4000, sourceHeight: 3000, mode: "exact", targetWidth: 1000, targetHeight: 1000, keepAspect: false })).toEqual({ width: 1000, height: 1000 });
  });

  it("rejects invalid source and target dimensions", () => {
    expect(() => calculateResizeDimensions({ sourceWidth: 0, sourceHeight: 3000, mode: "width", targetWidth: 1000, targetHeight: 1, keepAspect: true })).toThrow();
    expect(() => calculateResizeDimensions({ sourceWidth: 4000, sourceHeight: 3000, mode: "width", targetWidth: 0.4, targetHeight: 1, keepAspect: true })).toThrow();
    expect(() => calculateResizeDimensions({ sourceWidth: 4000, sourceHeight: 3000, mode: "exact", targetWidth: 1000, targetHeight: Number.NaN, keepAspect: true })).toThrow();
  });
});

it("limits the total output pixels in one resize batch", () => {
  expect(isResizeBatchTooLarge([{ width: 5000, height: 5000 }, { width: 5000, height: 5000 }])).toBe(false);
  expect(isResizeBatchTooLarge(Array.from({ length: 4 }, () => ({ width: 6000, height: 5000 })))).toBe(true);
});
