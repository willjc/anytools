import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { buildWorkbookXlsx, toCellValue } from "@/lib/server/xlsx";

describe("toCellValue", () => {
  it("converts numeric-looking text to numbers", () => {
    expect(toCellValue("1,234.50")).toBe(1234.5);
    expect(toCellValue("-45")).toBe(-45);
    expect(toCellValue(" 42 ")).toBe(42);
  });

  it("keeps text, currency symbols, and percentages as text", () => {
    expect(toCellValue("¥20")).toBe("¥20");
    expect(toCellValue("12%")).toBe("12%");
    expect(toCellValue("2026-09-06")).toBe("2026-09-06");
    expect(toCellValue("")).toBe("");
  });
});

describe("buildWorkbookXlsx", () => {
  it("writes sheets with typed cells, bold headers, and widths", async () => {
    const bytes = await buildWorkbookXlsx([
      [
        ["名称", "数量", "备注"],
        ["苹果", "1,200", "红富士"],
        ["香蕉", "0.5", ""],
      ],
      [["单表", "1"]],
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as ArrayBuffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["表1", "表2"]);

    const sheet = workbook.worksheets[0];
    expect(sheet.getCell("A1").font?.bold).toBe(true);
    expect(sheet.getCell("A2").value).toBe("苹果");
    expect(sheet.getCell("B2").value).toBe(1200);
    expect(typeof sheet.getCell("B2").value).toBe("number");
    expect(sheet.getCell("B3").value).toBe(0.5);
    expect(sheet.getCell("C2").value).toBe("红富士");
    expect(sheet.getColumn("A").width).toBeGreaterThan(4);
  });

  it("caps sheets and rows", async () => {
    const many = Array.from({ length: 40 }, (_, i) => [[`t${i}`], [`v${i}`]]);
    const bytes = await buildWorkbookXlsx(many);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as ArrayBuffer);
    expect(workbook.worksheets).toHaveLength(30);
  });

  it("rejects nothing for empty input (caller validates)", async () => {
    const bytes = await buildWorkbookXlsx([]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as ArrayBuffer);
    expect(workbook.worksheets).toHaveLength(0);
  });
});
