/**
 * 发票拼版打印的版面计算：把若干发票页拼到 A4 纸上（1 / 2 / 4 张每页）。
 * 单位为 PDF 点（pt），A4 = 595.28 × 841.89。
 */

export type PrintPerPage = 1 | 2 | 4;

export const A4 = { width: 595.28, height: 841.89 } as const;

export const PRINT_MARGIN_PT = 28;
export const PRINT_GAP_PT = 18;

export type PrintCell = { x: number; y: number; width: number; height: number };

export type PrintLayout = {
  pageWidth: number;
  pageHeight: number;
  cells: PrintCell[];
};

/** 生成单页 A4 的单元格布局（pdf-lib 坐标原点在左下角）。 */
export function buildPrintLayout(perPage: PrintPerPage, marginPt = PRINT_MARGIN_PT, gapPt = PRINT_GAP_PT): PrintLayout {
  if (perPage === 4) {
    // 横向 A4，2×2
    const pageWidth = A4.height;
    const pageHeight = A4.width;
    const cellWidth = (pageWidth - marginPt * 2 - gapPt) / 2;
    const cellHeight = (pageHeight - marginPt * 2 - gapPt) / 2;
    return {
      pageWidth,
      pageHeight,
      cells: [
        { x: marginPt, y: marginPt + cellHeight + gapPt, width: cellWidth, height: cellHeight },
        { x: marginPt + cellWidth + gapPt, y: marginPt + cellHeight + gapPt, width: cellWidth, height: cellHeight },
        { x: marginPt, y: marginPt, width: cellWidth, height: cellHeight },
        { x: marginPt + cellWidth + gapPt, y: marginPt, width: cellWidth, height: cellHeight },
      ],
    };
  }

  if (perPage === 2) {
    // 纵向 A4，上下两联
    const cellHeight = (A4.height - marginPt * 2 - gapPt) / 2;
    return {
      pageWidth: A4.width,
      pageHeight: A4.height,
      cells: [
        { x: marginPt, y: marginPt + cellHeight + gapPt, width: A4.width - marginPt * 2, height: cellHeight },
        { x: marginPt, y: marginPt, width: A4.width - marginPt * 2, height: cellHeight },
      ],
    };
  }

  return {
    pageWidth: A4.width,
    pageHeight: A4.height,
    cells: [{ x: marginPt, y: marginPt, width: A4.width - marginPt * 2, height: A4.height - marginPt * 2 }],
  };
}

/** 保持长宽比，把内容尺寸缩放进单元格并居中。 */
export function fitIntoCell(cell: PrintCell, contentWidth: number, contentHeight: number): PrintCell {
  const scale = Math.min(cell.width / contentWidth, cell.height / contentHeight);
  const width = contentWidth * scale;
  const height = contentHeight * scale;
  return {
    x: cell.x + (cell.width - width) / 2,
    y: cell.y + (cell.height - height) / 2,
    width,
    height,
  };
}

/** 总页数需要多少张 A4。 */
export function pagesNeeded(pageCount: number, perPage: PrintPerPage): number {
  if (pageCount <= 0) return 0;
  return Math.ceil(pageCount / perPage);
}
