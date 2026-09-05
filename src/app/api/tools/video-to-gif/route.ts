import { NextResponse } from "next/server";

import { GIF_FPS, GIF_MAX_DURATION_SECONDS, GIF_WIDTHS, type GifFps, type GifWidth } from "@/lib/media-options";
import { convertVideoToGif } from "@/lib/server/ffmpeg";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

function numberField(formData: FormData, field: string, fallback: number): number {
  const parsed = Number(formData.get(field));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, {
      allowedExtensions: ["mp4", "mov", "mkv", "avi", "webm"],
    });

    const fps: GifFps = GIF_FPS.includes(numberField(formData, "fps", 15) as GifFps)
      ? (numberField(formData, "fps", 15) as GifFps)
      : 15;
    const width: GifWidth = GIF_WIDTHS.includes(numberField(formData, "width", 480) as GifWidth)
      ? (numberField(formData, "width", 480) as GifWidth)
      : 480;
    const startSeconds = Math.max(0, numberField(formData, "startSeconds", 0));
    const durationSeconds = Math.max(0, numberField(formData, "durationSeconds", 0));
    if (durationSeconds > GIF_MAX_DURATION_SECONDS) {
      return NextResponse.json({ error: `单次最多转换 ${GIF_MAX_DURATION_SECONDS} 秒，请缩短时长。` }, { status: 400 });
    }

    const bytes = await convertVideoToGif(new Uint8Array(await file.arrayBuffer()), { fps, width, startSeconds, durationSeconds });
    return binaryResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}.gif`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message.includes("超过 30MB")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[video-to-gif] processing failed", error);
    return NextResponse.json({ error: "转换失败，请检查视频格式后重试。" }, { status: 422 });
  }
}
