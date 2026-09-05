import { NextResponse } from "next/server";

import { GIF_COMPRESS_LEVELS, type GifCompressLevel } from "@/lib/media-options";
import { compressGif } from "@/lib/server/ffmpeg";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, { allowedExtensions: ["gif"] });

    const requested = formData.get("level");
    const level: GifCompressLevel = GIF_COMPRESS_LEVELS.some((item) => item.id === requested)
      ? (requested as GifCompressLevel)
      : "balanced";

    const bytes = await compressGif(new Uint8Array(await file.arrayBuffer()), level);
    return binaryResponse(bytes, `${file.name.replace(/\.gif$/i, "")}-compressed.gif`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[gif-compress] processing failed", error);
    return NextResponse.json({ error: "压缩失败，请检查文件后重试。" }, { status: 422 });
  }
}
