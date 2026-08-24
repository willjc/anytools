import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { coverAndWriteText } from "@/lib/pdf-edit-text";

const ONE_BY_ONE_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
  (char) => char.charCodeAt(0),
);

async function createTwoPagePdf(): Promise<ArrayBuffer> {
  const source = await PDFDocument.create();
  source.addPage([595, 842]);
  source.addPage([595, 842]);
  return Uint8Array.from(await source.save()).buffer;
}

describe("coverAndWriteText", () => {
  it("covers the original region and writes ASCII replacement text", async () => {
    const sourceBytes = await createTwoPagePdf();

    const output = await coverAndWriteText(sourceBytes, [
      { pageNumber: 0, x: 50, y: 700, width: 120, height: 14, fontSize: 12, content: { kind: "text", value: "2026" } },
    ]);
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(2);
    expect(output.byteLength).toBeGreaterThan(sourceBytes.byteLength);
  });

  it("accepts pre-rendered PNG content for non-latin replacements", async () => {
    const sourceBytes = await createTwoPagePdf();

    const output = await coverAndWriteText(sourceBytes, [
      {
        pageNumber: 1,
        x: 50,
        y: 700,
        width: 60,
        height: 12,
        fontSize: 12,
        content: { kind: "png", bytes: ONE_BY_ONE_PNG, drawWidthPt: 40, drawHeightPt: 10 },
      },
    ]);
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(2);
  });

  it("rejects patches pointing at missing pages", async () => {
    const sourceBytes = await createTwoPagePdf();
    await expect(
      coverAndWriteText(sourceBytes, [
        { pageNumber: 3, x: 50, y: 700, width: 120, height: 14, fontSize: 12, content: { kind: "text", value: "x" } },
      ]),
    ).rejects.toThrow();
  });
});
