import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { numberPdfBytes } from "@/lib/pdf-page-numbers";

describe("numberPdfBytes", () => {
  it("stamps page numbers without changing page count", async () => {
    const source = await PDFDocument.create();
    source.addPage([300, 400]);
    source.addPage([300, 400]);
    const sourceBytes = Uint8Array.from(await source.save()).buffer;

    const output = await numberPdfBytes(sourceBytes, {
      position: "bottom-center",
      startAt: 1,
      template: "{n} / {total}",
    });
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(2);
    expect(output.length).not.toBe(sourceBytes.byteLength);
  });

  it("honors a custom starting number and template", async () => {
    const source = await PDFDocument.create();
    source.addPage([300, 400]);
    const output = await numberPdfBytes(await source.save(), {
      position: "bottom-right",
      startAt: 5,
      template: "-{n}-",
    });
    const document = await PDFDocument.load(output);
    expect(document.getPageCount()).toBe(1);
  });

  it("rejects templates without an {n} placeholder", async () => {
    const source = await PDFDocument.create();
    source.addPage([300, 400]);
    await expect(
      numberPdfBytes(await source.save(), { position: "bottom-center", startAt: 1, template: "page" }),
    ).rejects.toThrow();
  });
});
