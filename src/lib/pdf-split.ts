import { PDFDocument } from "pdf-lib";

export async function splitPdfBytes(sourceBytes: ArrayBuffer, pageNumbers: number[]): Promise<Uint8Array> {
  const source = await PDFDocument.load(sourceBytes);
  const result = await PDFDocument.create();
  const copiedPages = await result.copyPages(source, pageNumbers.map((page) => page - 1));
  copiedPages.forEach((page) => result.addPage(page));
  return result.save();
}
