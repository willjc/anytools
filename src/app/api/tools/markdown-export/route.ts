import { NextResponse } from "next/server";

import { convertHtmlDocument } from "@/lib/server/libreoffice";
import { markdownToHtml } from "@/lib/server/markdown";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, { allowedExtensions: ["md", "markdown"] });
    const format = formData.get("format") === "pdf" ? "pdf" : "docx";
    let markdown: string;
    try {
      markdown = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
    } catch {
      throw new UploadError("Markdown 文件必须使用 UTF-8 编码。", 422);
    }
    const bytes = await convertHtmlDocument(markdownToHtml(markdown), format);
    return binaryResponse(bytes, `${file.name.replace(/\.(md|markdown)$/i, "")}.${format}`);
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (isCloudToolUnavailable(error)) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[markdown-export] conversion failed", error);
    return NextResponse.json({ error: "转换失败，请检查文件内容后重试。" }, { status: 422 });
  }
}
