import { NextResponse } from "next/server";

import { readUploadedFile, UploadError, binaryResponse } from "@/lib/server/upload";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function rembgUrl(): string {
  return process.env.ALLTOOLS_REMBG_URL?.trim() || "";
}

export async function POST(request: Request) {
  if (!rembgUrl()) {
    return NextResponse.json({ error: "去背景服务未配置，暂不可用。" }, { status: 503 });
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
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "图片超过 10MB，请先压缩后再试。" }, { status: 413 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name || "image.png");

  try {
    const upstream = await fetch(`${rembgUrl().replace(/\/$/, "")}/remove`, {
      method: "POST",
      body: upstreamForm,
      signal: AbortSignal.timeout(60_000),
    });
    if (!upstream.ok) {
      console.error("[remove-bg] upstream error", upstream.status, (await upstream.text().catch(() => "")).slice(0, 200));
      return NextResponse.json({ error: "去背景失败，请换一张图片试试。" }, { status: 502 });
    }
    const png = new Uint8Array(await upstream.arrayBuffer());
    return binaryResponse(png, `${file.name.replace(/\.[^.]+$/, "")}-去背景.png`);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "处理超时，请再试一次。" }, { status: 504 });
    }
    console.error("[remove-bg] upstream failed", error);
    return NextResponse.json({ error: "去背景服务暂时不可用，请稍后再试。" }, { status: 502 });
  }
}
