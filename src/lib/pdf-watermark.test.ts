import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { watermarkPdfBytes } from "@/lib/pdf-watermark";

const ONE_BY_ONE_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
  (char) => char.charCodeAt(0),
);

async function createThreePagePdf(): Promise<ArrayBuffer> {
  const source = await PDFDocument.create();
  for (let index = 0; index < 3; index += 1) {
    source.addPage([595, 842]);
  }
  return Uint8Array.from(await source.save()).buffer;
}

describe("watermarkPdfBytes", () => {
  it("tiles plain-text watermarks across every page", async () => {
    const sourceBytes = await createThreePagePdf();

    const output = await watermarkPdfBytes(sourceBytes, {
      text: "CONFIDENTIAL",
      fontSize: 24,
      opacity: 0.15,
      angleDeg: -30,
      stepX: 220,
      stepY: 140,
    });
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(3);
    expect(output.byteLength).toBeGreaterThan(sourceBytes.byteLength);
  });

  it("accepts pre-rendered tiles for non-latin watermarks", async () => {
    const sourceBytes = await createThreePagePdf();

    const output = await watermarkPdfBytes(sourceBytes, {
      tilePngBytes: ONE_BY_ONE_PNG,
      tileWidthPt: 80,
      tileHeightPt: 20,
      opacity: 0.2,
      angleDeg: -30,
      stepX: 200,
      stepY: 120,
    });
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(3);
    expect(document.getPage(0).node.Resources()).toBeTruthy();
  });

  it("rejects inputs without text or tile", async () => {
    const sourceBytes = await createThreePagePdf();
    await expect(
      watermarkPdfBytes(sourceBytes, { opacity: 0.2, angleDeg: -30, stepX: 200, stepY: 120 }),
    ).rejects.toThrow();
  });
});
