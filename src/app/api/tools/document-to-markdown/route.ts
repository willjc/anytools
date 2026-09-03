import { NextResponse } from "next/server";

import { convertWithMineru, MineruConfigurationError } from "@/lib/server/mineru";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "jp2", "webp", "gif", "bmp"];

export async function POST(request: Request) {
  try {
    const { file } = await readUploadedFile(request, { allowedExtensions: ALLOWED_EXTENSIONS });
    const bytes = await convertWithMineru(file.name, new Uint8Array(await file.arrayBuffer()));
    return binaryResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}.md`);
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof MineruConfigurationError || isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[document-to-markdown] recognition failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "识别失败，请稍后重试。" }, { status: 502 });
  }
}
