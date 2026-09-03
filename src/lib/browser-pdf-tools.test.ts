import { describe, expect, it } from "vitest";

import {
  getImageKind,
  getImageFileLimitError,
  getImageLimitError,
  getImagePdfLayout,
  getScaledSize,
  IMAGE_TO_PDF_LIMITS,
} from "@/lib/browser-pdf-tools";

describe("browser PDF tool helpers", () => {
  it("recognizes only JPEG, PNG and WebP files", () => {
    expect(getImageKind("image/jpeg", "photo.bin")).toBe("jpeg");
    expect(getImageKind("", "photo.WEBP")).toBe("webp");
    expect(getImageKind("image/gif", "photo.gif")).toBeUndefined();
  });

  it("rejects too many or overly large images", () => {
    const small = { width: 100, height: 100 };
    expect(getImageLimitError(Array.from({ length: IMAGE_TO_PDF_LIMITS.maxFiles + 1 }, () => small))).toContain("最多");
    expect(getImageLimitError([{ width: 10_000, height: 5_000 }])).toContain("单张");
    expect(getImageLimitError(Array.from({ length: 4 }, () => ({ width: 6_000, height: 5_000 })))).toContain("总像素");
  });

  it("limits individual and total image file bytes", () => {
    expect(getImageFileLimitError(21 * 1024 * 1024, 21 * 1024 * 1024)).toContain("20 MB");
    expect(getImageFileLimitError(10 * 1024 * 1024, 101 * 1024 * 1024)).toContain("100 MB");
    expect(getImageFileLimitError(10 * 1024 * 1024, 80 * 1024 * 1024)).toBeUndefined();
  });

  it("uses the image ratio as the page ratio", () => {
    const layout = getImagePdfLayout(1600, 900, "original");

    expect(layout.pageWidth / layout.pageHeight).toBeCloseTo(16 / 9);
    expect(layout.drawX).toBe(0);
    expect(layout.drawY).toBe(0);
    expect(layout.drawWidth).toBe(layout.pageWidth);
    expect(layout.drawHeight).toBe(layout.pageHeight);
  });

  it("fits images inside an automatically oriented A4 page", () => {
    const layout = getImagePdfLayout(1600, 900, "a4");

    expect(layout.pageWidth).toBeGreaterThan(layout.pageHeight);
    expect(layout.drawWidth).toBeLessThan(layout.pageWidth);
    expect(layout.drawHeight).toBeLessThan(layout.pageHeight);
    expect(layout.drawWidth / layout.drawHeight).toBeCloseTo(16 / 9);
    expect(layout.drawX).toBeGreaterThan(0);
    expect(layout.drawY).toBeGreaterThan(0);
  });

  it("downscales without enlarging", () => {
    expect(getScaledSize(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 });
    expect(getScaledSize(800, 600, 1000)).toEqual({ width: 800, height: 600 });
  });
});
