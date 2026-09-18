import { NextResponse } from "next/server";

import { compressPdfWithGhostscript, isCompressLevel } from "@/lib/server/ghostscript";
import { compressPdfWithQpdf } from "@/lib/server/qpdf";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, { allowedExtensions: ["pdf"] });
    const inputBytes = new Uint8Array(await file.arrayBuffer());

    const levelParam = formData.get("level");
    const level = isCompressLevel(levelParam) ? levelParam : "balanced";

    // light 用 qpdf 做无损结构优化；balanced/extreme 用 Ghostscript 降采样图片。
    let outputBytes =
      level === "light"
        ? await compressPdfWithQpdf(inputBytes)
        : await compressPdfWithGhostscript(inputBytes, level);

    // Ghostscript 对少数纯文字 PDF 反而更大，此时回退为原文件，保证「不会变大」。
    if (outputBytes.length >= inputBytes.length) {
      outputBytes = inputBytes;
    }

    return binaryResponse(outputBytes, `${file.name.replace(/\.pdf$/i, "")}-compressed.pdf`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[pdf-compress] processing failed", error);
    return NextResponse.json({ error: "压缩失败：文件可能已加密或损坏，请换一个文件重试。" }, { status: 422 });
  }
}
