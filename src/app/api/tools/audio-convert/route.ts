import { NextResponse } from "next/server";

import { AUDIO_TARGETS, type AudioFormat } from "@/lib/media-options";
import { convertAudio } from "@/lib/server/ffmpeg";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

const LOSSY_BITRATES = [96, 128, 192, 256, 320];

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, {
      allowedExtensions: ["mp3", "wav", "m4a", "aac", "flac", "ogg"],
    });

    const requestedFormat = String(formData.get("format") ?? "mp3") as AudioFormat;
    if (!AUDIO_TARGETS.some((target) => target.format === requestedFormat)) {
      return NextResponse.json({ error: "不支持的目标格式。" }, { status: 400 });
    }
    const bitrateKbps = Number(formData.get("bitrateKbps"));
    const safeBitrate = LOSSY_BITRATES.includes(bitrateKbps) ? bitrateKbps : 192;

    const { bytes } = await convertAudio(new Uint8Array(await file.arrayBuffer()), requestedFormat, safeBitrate);
    return binaryResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}.${requestedFormat}`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[audio-convert] conversion failed", error);
    return NextResponse.json(
      { error: error instanceof Error && error.message ? error.message : "转换失败，请重试。" },
      { status: 422 },
    );
  }
}
