import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { organizePdfBytes } from "@/lib/pdf-organize";

export type OrganizedPage = {
  index: number;
  rotation: number;
};

async function createPdf(pageSizes: [number, number][]): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  for (const [width, height] of pageSizes) {
    document.addPage([width, height]);
  }
  const bytes = await document.save();
  return Uint8Array.from(bytes).buffer;
}

describe("organizePdfBytes", () => {
  it("reorders, drops, and rotates pages", async () => {
    const source = await createPdf([
      [300, 400],
      [400, 500],
      [500, 600],
    ]);

    const output = await organizePdfBytes(source, [
      { index: 2, rotation: 90 },
      { index: 0, rotation: 0 },
    ]);
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(2);
    expect(document.getPage(0).getSize()).toMatchObject({ width: 500, height: 600 });
    expect(document.getPage(1).getSize()).toMatchObject({ width: 300, height: 400 });
    expect(document.getPage(0).getRotation().angle).toBe(90);
    expect(document.getPage(1).getRotation().angle).toBe(0);
  });

  it("rejects out-of-range page indexes", async () => {
    const source = await createPdf([[300, 400]]);
    await expect(organizePdfBytes(source, [{ index: 5, rotation: 0 }])).rejects.toThrow();
  });
});
