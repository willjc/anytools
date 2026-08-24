import { describe, expect, it } from "vitest";

import { computeGridSlices } from "@/lib/image-grid";

describe("computeGridSlices", () => {
  it("center-crops to a square and returns nine equal cells", () => {
    const slices = computeGridSlices(900, 600);

    expect(slices).toHaveLength(9);
    for (const slice of slices) {
      expect(slice.width).toBeCloseTo(200);
      expect(slice.height).toBeCloseTo(200);
      expect(slice.y).toBeGreaterThanOrEqual(0);
    }
    expect(slices[0].x).toBeCloseTo(150);
    expect(slices[8]).toEqual({ x: 550, y: 400, width: 200, height: 200 });
  });

  it("uses the full canvas when already square", () => {
    const slices = computeGridSlices(300, 300);
    expect(slices[4]).toEqual({ x: 100, y: 100, width: 100, height: 100 });
  });
});
