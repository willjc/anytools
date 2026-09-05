import { NextResponse } from "next/server";

import {
  buildDeckSystemPrompt,
  buildDeckUserPrompt,
  clampInput,
  clampSlideCount,
  parseDeckLine,
  type GenerateEvent,
} from "@/lib/ai-ppt";
import { consumeAiCredit, AiRateLimitError, clientIpOf } from "@/lib/server/ai-rate-limit";
import { DeepSeekConfigurationError, DeepSeekUpstreamError, streamChatCompletion } from "@/lib/server/deepseek";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const input = clampInput(body.input);
  if (!input) {
    return NextResponse.json({ error: "请先输入 PPT 主题或粘贴大纲内容。" }, { status: 400 });
  }
  const slideCount = clampSlideCount(body.slideCount);
  const audience = clampInput(body.audience, 100) || undefined;

  try {
    consumeAiCredit(clientIpOf(request));
  } catch (error) {
    if (error instanceof AiRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: GenerateEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const messages = [
          { role: "system" as const, content: buildDeckSystemPrompt(slideCount) },
          { role: "user" as const, content: buildDeckUserPrompt(input, slideCount, audience) },
        ];

        let buffer = "";
        let total = 0;
        let title = "";
        let subtitle: string | undefined;

        for await (const delta of streamChatCompletion(messages)) {
          buffer += delta;
          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex >= 0) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            newlineIndex = buffer.indexOf("\n");
            const parsed = parseDeckLine(line);
            if (!parsed) continue;
            if (parsed.kind === "meta") {
              title = parsed.meta.title;
              subtitle = parsed.meta.subtitle;
              send({ type: "meta", title, subtitle });
            } else {
              total += 1;
              send({ type: "slide", slide: parsed.slide });
            }
          }
        }

        // 处理最后一行（可能没有换行符收尾）
        const tail = parseDeckLine(buffer);
        if (tail?.kind === "meta" && !title) send({ type: "meta", title: tail.meta.title, subtitle: tail.meta.subtitle });
        if (tail?.kind === "slide") {
          total += 1;
          send({ type: "slide", slide: tail.slide });
        }

        if (!title && total === 0) {
          send({ type: "error", message: "AI 没有返回有效内容，请调整主题后重试。" });
        } else {
          send({ type: "done", total });
        }
      } catch (error) {
        if (error instanceof DeepSeekConfigurationError || error instanceof DeepSeekUpstreamError) {
          send({ type: "error", message: error.message });
        } else {
          console.error("[ai-ppt] generation failed", error);
          send({ type: "error", message: "生成中断，请稍后重试。" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
