import { NextResponse } from "next/server";

import { convertPdfToDocx } from "@/lib/server/libreoffice";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { file } = await readUploadedFile(request, { allowedExtensions: ["pdf"] });
    const bytes = await convertPdfToDocx(new Uint8Array(await file.arrayBuffer()));
    return binaryResponse(bytes, `${file.name.replace(/\.pdf$/i, "")}.docx`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[pdf-to-word] conversion failed", error);
    return NextResponse.json({ error: error instanceof Error && error.message ? error.message : "转换失败，请重试。" }, { status: 422 });
  }
}
