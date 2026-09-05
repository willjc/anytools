import { NextResponse } from "next/server";

import { PPT_LIMITS, normalizeSlide, type Slide } from "@/lib/ai-ppt";
import { buildPptx } from "@/lib/server/pptx";
import { binaryResponse } from "@/lib/server/upload";

export const runtime = "nodejs";

function safeFileName(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60);
  return cleaned || "AI 演示文稿";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const rawSlides = Array.isArray(body.slides) ? body.slides : [];
  const slides: Slide[] = [];
  for (const item of rawSlides) {
    const slide = normalizeSlide(item);
    if (slide) slides.push(slide);
    if (slides.length >= PPT_LIMITS.maxExportSlides) break;
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 80) : "";
  const subtitle = typeof body.subtitle === "string" && body.subtitle.trim() ? body.subtitle.trim().slice(0, 120) : undefined;

  if (!title && slides.length === 0) {
    return NextResponse.json({ error: "没有可导出的幻灯片。" }, { status: 400 });
  }

  try {
    const bytes = await buildPptx({ title: title || "演示文稿", subtitle }, slides);
    return binaryResponse(new Uint8Array(bytes), `${safeFileName(title)}.pptx`);
  } catch (error) {
    console.error("[ai-ppt] export failed", error);
    return NextResponse.json({ error: "生成 PPTX 文件失败，请重试。" }, { status: 500 });
  }
}
