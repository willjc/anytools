import { NextResponse } from "next/server";

export class UploadError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

export function maxUploadBytes(): number {
  const parsed = Number(process.env.ALLTOOLS_MAX_UPLOAD_MB);
  const megabytes = Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  return megabytes * 1024 * 1024;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export async function readUploadedFile(
  request: Request,
  { allowedExtensions, field = "file" }: { allowedExtensions: readonly string[]; field?: string },
): Promise<{ file: File; formData: FormData }> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new UploadError("请求格式不正确。", 400);
  }

  return { file: pickFile(formData, { allowedExtensions, field }), formData };
}

export function pickFile(
  formData: FormData,
  { allowedExtensions, field = "file" }: { allowedExtensions: readonly string[]; field?: string },
): File {
  const file = formData.get(field);
  if (!(file instanceof File)) {
    throw new UploadError("请选择要处理的文件。", 400);
  }

  const extension = extensionOf(file.name);
  if (!allowedExtensions.includes(extension)) {
    throw new UploadError(`只支持这些格式：${allowedExtensions.map((item) => `.${item}`).join(" / ")}`, 415);
  }

  const limit = maxUploadBytes();
  if (file.size > limit) {
    throw new UploadError(`文件超过大小限制（最大 ${Math.floor(limit / 1024 / 1024)} MB）。`, 413);
  }

  return file;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  flac: "audio/flac",
  jpg: "image/jpeg",
  png: "image/png",
};

export function binaryResponse(bytes: Uint8Array, fileName: string): NextResponse {
  const extension = extensionOf(fileName);
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="download.${extension}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}

interface CloudToolUnavailableMarker {
  name: string;
  message: string;
}

export function isCloudToolUnavailable(error: unknown): error is CloudToolUnavailableMarker {
  return Boolean(error && typeof error === "object" && (error as { name?: unknown }).name === "CloudToolUnavailableError");
}
