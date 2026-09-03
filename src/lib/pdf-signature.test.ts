import { describe, expect, it } from "vitest";
import { degrees, PDFDocument } from "pdf-lib";

import {
  addSignatureImageToPdf,
  clampSignaturePlacement,
  supportsSimpleSignaturePlacement,
  toPdfSignatureRect,
} from "@/lib/pdf-signature";

const ONE_BY_ONE_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
  (char) => char.charCodeAt(0),
);

const TWO_BY_TWO_JPG = Uint8Array.from(
  atob("/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYyLjExLjEwMAD/2wBDAAgEBAQEBAUFBQUFBQYGBgYGBgYGBgYGBgYHBwcICAgHBwcGBgcHCAgICAkJCQgICAgJCQoKCgwMCwsODg4RERT/xABLAAEBAAAAAAAAAAAAAAAAAAAABwEBAAAAAAAAAAAAAAAAAAAAABABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/AABEIAAIAAgMBIgACEQADEQD/2gAMAwEAAhEDEQA/AL+AD//Z"),
  (char) => char.charCodeAt(0),
);

async function createTwoPagePdf(): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.addPage([600, 800]);
  document.addPage([400, 300]);
  return document.save();
}

describe("signature placement", () => {
  it("converts top-left browser ratios to bottom-left PDF coordinates", () => {
    expect(
      toPdfSignatureRect(
        { xRatio: 0.5, yRatio: 0.25, widthRatio: 0.3 },
        { width: 600, height: 800 },
        3,
      ),
    ).toEqual({ x: 300, y: 540, width: 180, height: 60 });
  });

  it("keeps a dragged signature inside the page", () => {
    expect(
      clampSignaturePlacement(
        { xRatio: 0.9, yRatio: 0.95, widthRatio: 0.4 },
        { width: 600, height: 800 },
        3,
      ),
    ).toEqual({ xRatio: 0.6, yRatio: 0.9, widthRatio: 0.4 });
  });

  it("rejects rotated or cropped pages whose preview coordinates differ", async () => {
    const document = await PDFDocument.create();
    const plain = document.addPage([600, 800]);
    const rotated = document.addPage([600, 800]);
    rotated.setRotation(degrees(90));
    const cropped = document.addPage([600, 800]);
    cropped.setCropBox(50, 100, 400, 600);

    expect(supportsSimpleSignaturePlacement(plain)).toBe(true);
    expect(supportsSimpleSignaturePlacement(rotated)).toBe(false);
    expect(supportsSimpleSignaturePlacement(cropped)).toBe(false);
  });
});

describe("addSignatureImageToPdf", () => {
  it("places a PNG on the selected page without changing page count", async () => {
    const source = await createTwoPagePdf();
    const output = await addSignatureImageToPdf(source, ONE_BY_ONE_PNG, "png", {
      pageIndex: 1,
      xRatio: 0.25,
      yRatio: 0.3,
      widthRatio: 0.2,
    });
    const result = await PDFDocument.load(output);

    expect(result.getPageCount()).toBe(2);
    expect(output.length).toBeGreaterThan(source.length);
  });

  it("accepts JPG signature images", async () => {
    const source = await createTwoPagePdf();
    const output = await addSignatureImageToPdf(source, TWO_BY_TWO_JPG, "jpg", {
      pageIndex: 0,
      xRatio: 0.1,
      yRatio: 0.1,
      widthRatio: 0.2,
    });

    expect((await PDFDocument.load(output)).getPageCount()).toBe(2);
  });

  it("rejects a missing target page", async () => {
    await expect(
      addSignatureImageToPdf(await createTwoPagePdf(), ONE_BY_ONE_PNG, "png", {
        pageIndex: 2,
        xRatio: 0,
        yRatio: 0,
        widthRatio: 0.2,
      }),
    ).rejects.toThrow("目标页不存在");
  });
});
