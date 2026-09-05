import { NextResponse } from "next/server";

import { markdownToPlainText } from "@/lib/markdown-text";
import { convertWithMineru, MineruConfigurationError } from "@/lib/server/mineru";
import { isCloudToolUnavailable, readUploadedFile, UploadError } from "@/lib/server/upload";

export const runtime = "nodejs";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "jp2", "webp", "gif", "bmp"];
const MAX_RETURN_CHARS = 100_000;

export async function POST(request: Request) {
  try {
    const { file } = await readUploadedFile(request, { allowedExtensions: IMAGE_EXTENSIONS });
    const markdownBytes = await convertWithMineru(file.name, new Uint8Array(await file.arrayBuffer()));
    const markdown = new TextDecoder().decode(markdownBytes);
    const text = markdownToPlainText(markdown);

    return NextResponse.json(
      {
        text: text.slice(0, MAX_RETURN_CHARS),
        markdown: markdown.slice(0, MAX_RETURN_CHARS),
        truncated: text.length > MAX_RETURN_CHARS,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof MineruConfigurationError || isCloudToolUnavailable(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[image-to-text] recognition failed", error);
    return NextResponse.json({ error: "识别失败，请稍后重试。" }, { status: 502 });
  }
}
