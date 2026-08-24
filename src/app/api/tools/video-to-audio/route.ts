import { NextResponse } from "next/server";

import { extractAudioToMp3 } from "@/lib/server/ffmpeg";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

const ALLOWED = ["mp4", "mov", "mkv", "webm", "avi", "m4v"];

export async function POST(request: Request) {
  try {
    const { file } = await readUploadedFile(request, { allowedExtensions: ALLOWED });
    const bytes = await extractAudioToMp3(new Uint8Array(await file.arrayBuffer()));
    return binaryResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}.mp3`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[video-to-audio] extraction failed", error);
    return NextResponse.json(
      { error: error instanceof Error && error.message ? error.message : "提取失败：文件可能没有音轨或已损坏。" },
      { status: 422 },
    );
  }
}
