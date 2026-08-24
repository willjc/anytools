import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PatchContent =
  | { kind: "text"; value: string }
  | { kind: "png"; bytes: Uint8Array; drawWidthPt?: number; drawHeightPt?: number };

export type TextPatch = {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  content: PatchContent;
};

export async function coverAndWriteText(sourceBytes: ArrayBuffer | Uint8Array, patches: readonly TextPatch[]): Promise<Uint8Array> {
  if (patches.length === 0) {
    throw new Error("请先框选需要修改的文字。");
  }

  const document = await PDFDocument.load(sourceBytes);
  const font = await document.embedFont(StandardFonts.Helvetica);

  for (const patch of patches) {
    if (!Number.isInteger(patch.pageNumber) || patch.pageNumber < 0 || patch.pageNumber >= document.getPageCount()) {
      throw new Error(`修改目标第 ${patch.pageNumber + 1} 页不存在，原文档共 ${document.getPageCount()} 页。`);
    }
    const page = document.getPage(patch.pageNumber);
    const pageSize = page.getSize();
    if (
      !Number.isFinite(patch.x) ||
      !Number.isFinite(patch.y) ||
      patch.width <= 0 ||
      patch.height <= 0 ||
      patch.x < 0 ||
      patch.y < 0 ||
      patch.x > pageSize.width ||
      patch.y > pageSize.height
    ) {
      throw new Error("遮盖区域超出页面范围，请重新框选。");
    }

    page.drawRectangle({
      x: patch.x,
      y: patch.y,
      width: patch.width,
      height: patch.height,
      color: rgb(1, 1, 1),
    });

    if (patch.content.kind === "text") {
      const baselineY = patch.y + Math.max(1.5, (patch.height - patch.fontSize * 0.72) / 2);
      page.drawText(patch.content.value, {
        x: patch.x + 1,
        y: baselineY,
        size: Math.min(patch.fontSize, patch.height),
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else {
      const image = await document.embedPng(patch.content.bytes);
      page.drawImage(image, {
        x: patch.x,
        y: patch.y + Math.max(0, (patch.height - (patch.content.drawHeightPt ?? patch.height)) / 2),
        width: patch.content.drawWidthPt ?? patch.width,
        height: patch.content.drawHeightPt ?? patch.height,
      });
    }
  }

  return document.save();
}
