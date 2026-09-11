import { NextResponse } from "next/server";

import { convertEbook, isEbookInputFormat, isEbookOutputFormat } from "@/lib/server/ebook";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

const UPLOAD_EXTENSIONS = [...new Set(["epub", "mobi", "azw3", "pdf", "docx", "txt", "html", "rtf"])];

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, { allowedExtensions: UPLOAD_EXTENSIONS });

    const inputFormat = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!isEbookInputFormat(inputFormat)) {
      return NextResponse.json({ error: `暂不支持 ${inputFormat} 格式输入。` }, { status: 415 });
    }

    const format = formData.get("format");
    if (!isEbookOutputFormat(format)) {
      return NextResponse.json({ error: "请选择有效的目标格式。" }, { status: 400 });
    }
    if (format === inputFormat) {
      return NextResponse.json({ error: "目标格式与当前格式相同，无需转换。" }, { status: 400 });
    }

    const bytes = await convertEbook(new Uint8Array(await file.arrayBuffer()), inputFormat, format);
    return binaryResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}.${format}`);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[ebook-convert] conversion failed", error);
    return NextResponse.json(
      { error: error instanceof Error && error.message ? error.message : "转换失败，请重试。" },
      { status: 422 },
    );
  }
}
