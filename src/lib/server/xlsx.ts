/**
 * 把表格数据写成 .xlsx（exceljs）。
 * 数字样文本自动转为数值单元格，表头加粗，列宽按内容自适应。
 */

import ExcelJS from "exceljs";

export const XLSX_LIMITS = {
  maxSheets: 30,
  maxRowsPerSheet: 1000,
  maxCellChars: 400,
} as const;

/** 数字样文本（含千分位、正负号、小数）转数值；其余保持文本。 */
export function toCellValue(text: string): string | number {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/^-?[\d,]+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed.replace(/,/g, ""));
    if (Number.isFinite(numeric)) return numeric;
  }
  return text.slice(0, XLSX_LIMITS.maxCellChars);
}

function normalizeTables(tables: string[][][]): string[][][] {
  return tables
    .map((rows) => rows.slice(0, XLSX_LIMITS.maxRowsPerSheet).map((row) => row.map((cell) => String(cell ?? "").slice(0, XLSX_LIMITS.maxCellChars))))
    .filter((rows) => rows.length > 0)
    .slice(0, XLSX_LIMITS.maxSheets);
}

export async function buildWorkbookXlsx(tables: string[][][]): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "万用工具箱";

  normalizeTables(tables).forEach((rows, index) => {
    const sheet = workbook.addWorksheet(`表${index + 1}`);
    for (const row of rows) {
      sheet.addRow(row.map((cell) => toCellValue(cell)));
    }
    // 首行按表头处理
    if (rows.length > 1) {
      sheet.getRow(1).font = { bold: true };
    }
    // 列宽按内容自适应（CJK 按两倍宽度估算），限制在 8~45
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
      let widest = 8;
      for (const row of rows) {
        const value = row[columnIndex - 1] ?? "";
        const width = [...value].reduce((sum, char) => sum + (/[\u2e80-\ufaff\uff00-\uffef]/.test(char) ? 2 : 1), 0);
        widest = Math.max(widest, width);
      }
      sheet.getColumn(columnIndex).width = Math.min(45, widest + 2);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
