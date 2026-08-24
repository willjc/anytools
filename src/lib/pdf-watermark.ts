import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export type PdfWatermarkInput = {
  text?: string;
  fontSize?: number;
  tilePngBytes?: Uint8Array;
  tileWidthPt?: number;
  tileHeightPt?: number;
  opacity: number;
  angleDeg: number;
  stepX: number;
  stepY: number;
};

export async function watermarkPdfBytes(sourceBytes: ArrayBuffer | Uint8Array, input: PdfWatermarkInput): Promise<Uint8Array> {
  const hasText = typeof input.text === "string" && input.text.length > 0;
  const hasTile = input.tilePngBytes instanceof Uint8Array && input.tilePngBytes.byteLength > 0;
  if (!hasText && !hasTile) {
    throw new Error("请提供水印文字或水印贴图。");
  }

  const document = await PDFDocument.load(sourceBytes);
  const font = hasText ? await document.embedFont(StandardFonts.HelveticaBold) : undefined;
  const tile = hasTile ? await document.embedPng(input.tilePngBytes!) : undefined;
  const rotation = degrees(input.angleDeg);

  for (const page of document.getPages()) {
    const { width, height } = page.getSize();
    const tileWidthPt = input.tileWidthPt ?? (font ? font.widthOfTextAtSize(input.text!, input.fontSize ?? 24) : 0);
    const tileHeightPt = input.tileHeightPt ?? (input.fontSize ?? 24);

    for (let x = -tileWidthPt; x <= width + tileWidthPt; x += input.stepX) {
      for (let y = -tileHeightPt; y <= height + tileHeightPt; y += input.stepY) {
        if (tile) {
          page.drawImage(tile, { x, y, width: tileWidthPt, height: tileHeightPt, opacity: input.opacity, rotate: rotation });
        } else if (font) {
          page.drawText(input.text!, { x, y, size: input.fontSize ?? 24, font, color: rgb(0.5, 0.5, 0.5), opacity: input.opacity, rotate: rotation });
        }
      }
    }
  }

  return document.save();
}
