import { NextResponse } from "next/server";

import { compressVideoToMp4 } from "@/lib/server/ffmpeg";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";
import { VIDEO_HEIGHTS, type VideoHeight } from "@/lib/media-options";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, {
      allowedExtensions: ["mp4", "mov", "mkv", "avi", "webm"],
    });

    const requestedHeight = Number(formData.get("height"));
    const height: VideoHeight = VIDEO_HEIGHTS.includes(requestedHeight as VideoHeight)
      ? (requestedHeight as VideoHeight)
      : 720;

    const bytes = await compressVideoToMp4(new Uint8Array(await file.arrayBuffer()), height);
    return binaryResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}-compressed.mp4`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[video-compress] processing failed", error);
    return NextResponse.json(
      { error: error instanceof Error && error.message ? error.message : "压缩失败，请重试。" },
      { status: 422 },
    );
  }
}
