import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { splitPdfBytes } from "@/lib/pdf-split";

describe("splitPdfBytes", () => {
  it("creates a downloadable PDF with the requested pages", async () => {
    const source = await PDFDocument.create();
    source.addPage([300, 400]);
    source.addPage([400, 500]);
    source.addPage([500, 600]);
    const sourceBytes = await source.save();

    const outputBytes = await splitPdfBytes(Uint8Array.from(sourceBytes).buffer, [1, 3]);
    const output = await PDFDocument.load(outputBytes);

    expect(output.getPageCount()).toBe(2);
    expect(output.getPage(0).getSize()).toMatchObject({ width: 300, height: 400 });
    expect(output.getPage(1).getSize()).toMatchObject({ width: 500, height: 600 });
  });
});
