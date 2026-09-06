import { describe, expect, it } from "vitest";

import { buildPrintLayout, fitIntoCell, pagesNeeded, PRINT_MARGIN_PT } from "@/lib/invoice-print";

describe("buildPrintLayout", () => {
  it("single per page fills the whole A4 minus margins", () => {
    const layout = buildPrintLayout(1);
    expect(layout.pageWidth).toBeCloseTo(595.28);
    expect(layout.pageHeight).toBeCloseTo(841.89);
    expect(layout.cells).toHaveLength(1);
    expect(layout.cells[0].width).toBeCloseTo(595.28 - PRINT_MARGIN_PT * 2);
  });

  it("two per page stacks cells vertically", () => {
    const layout = buildPrintLayout(2);
    expect(layout.cells).toHaveLength(2);
    const [top, bottom] = layout.cells;
    expect(top.y).toBeGreaterThan(bottom.y);
    expect(top.x).toBe(bottom.x);
    expect(top.height).toBeCloseTo(bottom.height);
  });

  it("four per page uses landscape 2x2 grid", () => {
    const layout = buildPrintLayout(4);
    expect(layout.pageWidth).toBeCloseTo(841.89);
    expect(layout.pageHeight).toBeCloseTo(595.28);
    expect(layout.cells).toHaveLength(4);
    const xs = new Set(layout.cells.map((cell) => cell.x.toFixed(1)));
    const ys = new Set(layout.cells.map((cell) => cell.y.toFixed(1)));
    expect(xs.size).toBe(2);
    expect(ys.size).toBe(2);
  });
});

describe("fitIntoCell", () => {
  it("preserves aspect ratio and centers content", () => {
    const cell = { x: 0, y: 0, width: 200, height: 100 };
    const fitted = fitIntoCell(cell, 400, 200);
    expect(fitted.width).toBe(200);
    expect(fitted.height).toBe(100);
    const fitted2 = fitIntoCell(cell, 200, 400);
    expect(fitted2.height).toBe(100);
    expect(fitted2.width).toBe(50);
    expect(fitted2.x).toBeCloseTo(75);
  });
});

describe("pagesNeeded", () => {
  it("rounds up", () => {
    expect(pagesNeeded(7, 2)).toBe(4);
    expect(pagesNeeded(4, 4)).toBe(1);
    expect(pagesNeeded(0, 2)).toBe(0);
  });
});
