import { describe, expect, it } from "vitest";

import { clientPointToImagePoint, createRedactionRect, percentageRectToImageRect } from "@/lib/image-redact";

describe("clientPointToImagePoint", () => {
  it("maps a pointer from a scaled canvas to source-image coordinates", () => {
    expect(clientPointToImagePoint({
      clientX: 350,
      clientY: 225,
      bounds: { left: 100, top: 100, width: 500, height: 250 },
      imageWidth: 4000,
      imageHeight: 2000,
    })).toEqual({ x: 2000, y: 1000 });
  });

  it("clamps mobile pointer coordinates to the image", () => {
    expect(clientPointToImagePoint({
      clientX: 30,
      clientY: 500,
      bounds: { left: 50, top: 100, width: 300, height: 200 },
      imageWidth: 1200,
      imageHeight: 800,
    })).toEqual({ x: 0, y: 800 });
  });
});

describe("createRedactionRect", () => {
  it("normalizes reverse drags and rounds outward so edge pixels are covered", () => {
    expect(createRedactionRect({ x: 80.8, y: 90.2 }, { x: 10.4, y: 20.6 })).toEqual({
      x: 10,
      y: 20,
      width: 71,
      height: 71,
    });
  });

  it("converts keyboard-entered percentages and keeps them inside the image", () => {
    expect(percentageRectToImageRect({ x: 75, y: 80, width: 40, height: 30 }, 1000, 500)).toEqual({
      x: 750,
      y: 400,
      width: 250,
      height: 100,
    });
  });

  it("rejects invalid percentage rectangles", () => {
    expect(() => percentageRectToImageRect({ x: 100, y: 0, width: 10, height: 10 }, 1000, 500)).toThrow();
  });
});
