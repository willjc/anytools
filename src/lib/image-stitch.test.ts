import { describe, expect, it } from "vitest";

import { computeStitchLayout } from "@/lib/image-stitch";

describe("computeStitchLayout", () => {
  it("stacks vertically on the narrowest width and only scales down", () => {
    const layout = computeStitchLayout(
      [
        { width: 400, height: 300 },
        { width: 200, height: 100 },
      ],
      "vertical",
    );
    expect(layout.canvasWidth).toBe(200);
    expect(layout.canvasHeight).toBe(250);
    expect(layout.scaledSizes[0]).toEqual({ width: 200, height: 150 });
    expect(layout.offsets[1]).toEqual({ x: 0, y: 150 });
  });

  it("joins horizontally on the shortest height", () => {
    const layout = computeStitchLayout(
      [
        { width: 400, height: 300 },
        { width: 400, height: 150 },
      ],
      "horizontal",
    );
    expect(layout.canvasWidth).toBe(600);
    expect(layout.canvasHeight).toBe(150);
    expect(layout.offsets[1]).toEqual({ x: 200, y: 0 });
  });

  it("rejects an empty list", () => {
    expect(() => computeStitchLayout([], "vertical")).toThrow();
  });
});
