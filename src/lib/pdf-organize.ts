import { PDFDocument, degrees } from "pdf-lib";

export type OrganizedPage = {
  index: number;
  rotation: number;
};

export async function organizePdfBytes(sourceBytes: ArrayBuffer | Uint8Array, pages: readonly OrganizedPage[]): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error("请至少保留一个页面。");
  }

  const source = await PDFDocument.load(sourceBytes);
  const pageCount = source.getPageCount();
  for (const entry of pages) {
    if (!Number.isInteger(entry.index) || entry.index < 0 || entry.index >= pageCount) {
      throw new Error(`页码 ${entry.index + 1} 超出范围，原文档共 ${pageCount} 页。`);
    }
  }

  const result = await PDFDocument.create();
  for (const entry of pages) {
    const [copiedPage] = await result.copyPages(source, [entry.index]);
    copiedPage.setRotation(degrees(((entry.rotation % 360) + 360) % 360));
    result.addPage(copiedPage);
  }
  return result.save();
}
