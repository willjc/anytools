import { NextResponse } from "next/server";

import { formatFileSize } from "@/lib/file-utils";
import { CloudToolUnavailableError, compressPdfWithQpdf } from "@/lib/server/qpdf";

export const runtime = "nodejs";

const DEFAULT_MAX_UPLOAD_MB = 100;

function maxUploadBytes(): number {
  const parsed = Number(process.env.ALLTOOLS_MAX_UPLOAD_MB);
  const megabytes = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_UPLOAD_MB;
  return megabytes * 1024 * 1024;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传一个 PDF 文件。" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "目前只支持 PDF 文件。" }, { status: 415 });
  }

  const limit = maxUploadBytes();
  if (file.size > limit) {
    return NextResponse.json(
      { error: `文件超过大小限制（最大 ${formatFileSize(limit)}）。` },
      { status: 413 },
    );
  }

  try {
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    const outputBytes = await compressPdfWithQpdf(inputBytes);
    return new NextResponse(new Uint8Array(outputBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="compressed.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof CloudToolUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[pdf-compress] processing failed", error);
    return NextResponse.json(
      { error: "压缩失败：文件可能已加密或损坏，请换一个文件重试。" },
      { status: 422 },
    );
  }
}
