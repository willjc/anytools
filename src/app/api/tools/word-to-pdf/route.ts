import { NextResponse } from "next/server";

import { convertWordToPdf, isWordDocument } from "@/lib/server/libreoffice";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { file } = await readUploadedFile(request, { allowedExtensions: ["doc", "docx"] });
    const extension = file.name.toLowerCase().endsWith(".docx") ? "docx" : "doc";
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    if (!isWordDocument(inputBytes, extension)) {
      throw new UploadError("文件内容不是有效的 Word 文档。", 415);
    }

    const bytes = await convertWordToPdf(inputBytes, extension);
    return binaryResponse(bytes, `${file.name.replace(/\.(doc|docx)$/i, "")}.pdf`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[word-to-pdf] conversion failed", error);
    return NextResponse.json({ error: error instanceof Error && error.message ? error.message : "转换失败，请重试。" }, { status: 422 });
  }
}
