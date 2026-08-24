import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PageNumberPosition = "bottom-left" | "bottom-center" | "bottom-right" | "top-left" | "top-center" | "top-right";

export type PageNumberOptions = {
  position: PageNumberPosition;
  startAt: number;
  template: string;
};

const MARGIN_PT = 36;
const FONT_SIZE = 11;

export async function numberPdfBytes(sourceBytes: ArrayBuffer | Uint8Array, options: PageNumberOptions): Promise<Uint8Array> {
  if (!options.template.includes("{n}")) {
    throw new Error("页码格式必须包含 {n} 占位符。");
  }

  const document = await PDFDocument.load(sourceBytes);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const pages = document.getPages();
  const lastNumber = options.startAt + pages.length - 1;

  pages.forEach((page, pageIndex) => {
    const label = options.template.replace("{n}", String(options.startAt + pageIndex)).replace("{total}", String(lastNumber));
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, FONT_SIZE);

    let x = MARGIN_PT;
    if (options.position.endsWith("center")) x = (width - textWidth) / 2;
    if (options.position.endsWith("right")) x = width - MARGIN_PT - textWidth;

    const y = options.position.startsWith("top") ? height - MARGIN_PT - FONT_SIZE : MARGIN_PT;
    page.drawText(label, { x, y, size: FONT_SIZE, font, color: rgb(0.25, 0.25, 0.25) });
  });

  return document.save();
}
