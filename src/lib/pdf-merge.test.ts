import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { mergePdfBytes } from "@/lib/pdf-merge";

async function createPdf(pageSizes: [number, number][]): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  for (const [width, height] of pageSizes) {
    document.addPage([width, height]);
  }
  const bytes = await document.save();
  return Uint8Array.from(bytes).buffer;
}

describe("mergePdfBytes", () => {
  it("concatenates pages from multiple PDFs in order", async () => {
    const first = await createPdf([[300, 400]]);
    const second = await createPdf([
      [400, 500],
      [500, 600],
    ]);

    const merged = await mergePdfBytes([first, second]);
    const output = await PDFDocument.load(merged);

    expect(output.getPageCount()).toBe(3);
    expect(output.getPage(0).getSize()).toMatchObject({ width: 300, height: 400 });
    expect(output.getPage(1).getSize()).toMatchObject({ width: 400, height: 500 });
    expect(output.getPage(2).getSize()).toMatchObject({ width: 500, height: 600 });
  });

  it("rejects an empty file list", async () => {
    await expect(mergePdfBytes([])).rejects.toThrow();
  });
});
