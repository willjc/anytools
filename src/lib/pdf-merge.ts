import { PDFDocument } from "pdf-lib";

export async function mergePdfBytes(sourceBytesList: readonly ArrayBuffer[]): Promise<Uint8Array> {
  if (sourceBytesList.length === 0) {
    throw new Error("请至少选择一个 PDF 文件。");
  }

  const result = await PDFDocument.create();
  for (const sourceBytes of sourceBytesList) {
    const source = await PDFDocument.load(sourceBytes);
    const copiedPages = await result.copyPages(source, source.getPageIndices());
    copiedPages.forEach((page) => result.addPage(page));
  }
  return result.save();
}
