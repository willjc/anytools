import { NextResponse } from "next/server";

import {
  decryptPdf,
  encryptPdf,
  PdfProtectError,
  type PdfEncryptionOptions,
} from "@/lib/server/qpdf";
import { binaryResponse, isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

const MAX_PASSWORD_LENGTH = 128;

function passwordOf(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.slice(0, MAX_PASSWORD_LENGTH) : "";
}

function booleanOf(formData: FormData, field: string, fallback: boolean): boolean {
  const value = formData.get(field);
  if (typeof value !== "string") return fallback;
  return value === "true" || value === "1";
}

export async function POST(request: Request) {
  try {
    const { file, formData } = await readUploadedFile(request, { allowedExtensions: ["pdf"] });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const baseName = file.name.replace(/\.pdf$/i, "");
    const mode = formData.get("mode");

    if (mode === "encrypt") {
      const options: PdfEncryptionOptions = {
        userPassword: passwordOf(formData, "userPassword"),
        ownerPassword: passwordOf(formData, "ownerPassword"),
        allowPrint: booleanOf(formData, "allowPrint", true),
        allowCopy: booleanOf(formData, "allowCopy", true),
        allowModify: booleanOf(formData, "allowModify", false),
      };
      if (!options.userPassword && !options.ownerPassword) {
        return NextResponse.json({ error: "请至少设置一个密码。" }, { status: 400 });
      }
      const result = await encryptPdf(bytes, options);
      return binaryResponse(result, `${baseName}-加密.pdf`);
    }

    if (mode === "decrypt") {
      const password = passwordOf(formData, "password");
      const result = await decryptPdf(bytes, password);
      return binaryResponse(result, `${baseName}-已解锁.pdf`);
    }

    return NextResponse.json({ error: "请求参数不正确。" }, { status: 400 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof PdfProtectError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[pdf-protect] processing failed", error);
    return NextResponse.json({ error: "处理失败，文件可能已损坏，请重试。" }, { status: 500 });
  }
}
