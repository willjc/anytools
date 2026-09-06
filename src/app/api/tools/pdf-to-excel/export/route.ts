import { NextResponse } from "next/server";

import { PDF_TABLE_LIMITS } from "@/lib/pdf-tables";
import { buildWorkbookXlsx } from "@/lib/server/xlsx";
import { binaryResponse } from "@/lib/server/upload";

export const runtime = "nodejs";

function sanitizeName(name: unknown): string {
  return typeof name === "string" ? name.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const rawTables = Array.isArray(body.tables) ? body.tables : [];
  const tables: string[][][] = [];
  for (const table of rawTables) {
    if (!Array.isArray(table)) continue;
    const rows = table
      .filter((row): row is unknown[] => Array.isArray(row))
      .slice(0, PDF_TABLE_LIMITS.maxRowsPerTable)
      .map((row) => row.map((cell) => String(cell ?? "").slice(0, PDF_TABLE_LIMITS.maxCellChars)));
    if (rows.length > 0) tables.push(rows);
    if (tables.length >= PDF_TABLE_LIMITS.maxTables) break;
  }

  if (tables.length === 0) {
    return NextResponse.json({ error: "没有可导出的表格。" }, { status: 400 });
  }

  try {
    const bytes = await buildWorkbookXlsx(tables);
    const baseName = sanitizeName(body.name) || "PDF表格";
    return binaryResponse(bytes, `${baseName}.xlsx`);
  } catch (error) {
    console.error("[pdf-to-excel] export failed", error);
    return NextResponse.json({ error: "生成 Excel 失败，请重试。" }, { status: 500 });
  }
}
