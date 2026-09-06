import { NextResponse } from "next/server";

import { extractTablesFromMarkdown, PDF_TABLE_LIMITS } from "@/lib/pdf-tables";
import { convertWithMineru, MineruConfigurationError } from "@/lib/server/mineru";
import { isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { file } = await readUploadedFile(request, { allowedExtensions: ["pdf"] });
    const markdownBytes = await convertWithMineru(file.name, new Uint8Array(await file.arrayBuffer()));
    const markdown = new TextDecoder().decode(markdownBytes);
    const tables = extractTablesFromMarkdown(markdown);

    return NextResponse.json(
      { tables: tables.map((table) => table.rows), truncated: tables.length >= PDF_TABLE_LIMITS.maxTables },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof MineruConfigurationError || isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[pdf-to-excel] parse failed", error);
    return NextResponse.json({ error: "解析失败，请稍后重试。" }, { status: 502 });
  }
}
