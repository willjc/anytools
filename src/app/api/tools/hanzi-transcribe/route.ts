import { NextResponse } from "next/server";

import { readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = ["webm", "mp4", "m4a", "wav", "ogg", "aac", "mp3"];
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function asrUrl(): string {
  return process.env.ALLTOOLS_ASR_URL?.trim() || "";
}

export async function POST(request: Request) {
  if (!asrUrl()) {
    return NextResponse.json({ error: "语音服务未配置，请直接输入或粘贴文字。" }, { status: 503 });
  }

  let file: File;
  try {
    ({ file } = await readUploadedFile(request, { allowedExtensions: ALLOWED_EXTENSIONS }));
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "录音太长啦，请说一句话再松手。" }, { status: 413 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name || "audio.webm");

  try {
    const upstream = await fetch(`${asrUrl().replace(/\/$/, "")}/transcribe`, {
      method: "POST",
      body: upstreamForm,
      signal: AbortSignal.timeout(60_000),
    });
    const payload = (await upstream.json().catch(() => null)) as { text?: string; error?: string } | null;
    if (!upstream.ok || payload === null) {
      return NextResponse.json({ error: "语音识别服务暂时不可用，请稍后再试或直接输入。" }, { status: 502 });
    }
    return NextResponse.json({ text: payload.text ?? "" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "识别超时了，请再试一次。" }, { status: 504 });
    }
    console.error("[hanzi-transcribe] upstream failed", error);
    return NextResponse.json({ error: "语音服务暂时不可用，请直接输入文字。" }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json({ configured: Boolean(asrUrl()) });
}
