import { NextResponse } from "next/server";

import { convertHeicImage } from "@/lib/server/libheif";
import { binaryResponse, isCloudToolUnavailable, pickFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = pickFile(formData, { allowedExtensions: ["heic", "heif"] });
    const format = formData.get("format") === "png" ? "png" : "jpg";

    const bytes = await convertHeicImage(new Uint8Array(await file.arrayBuffer()), format);
    return binaryResponse(bytes, `${file.name.replace(/\.(heic|heif)$/i, "")}.${format}`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[heic-to-jpg] conversion failed", error);
    return NextResponse.json({ error: "转换失败：文件可能已损坏或不是 HEIC/HEIF 照片。" }, { status: 422 });
  }
}
