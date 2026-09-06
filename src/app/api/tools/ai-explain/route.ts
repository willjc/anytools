import { NextResponse } from "next/server";

import {
  AI_EXPLAIN_TASKS,
  buildExplainSystemPrompt,
  buildExplainUserPrompt,
  buildLetterUserPrompt,
  cleanInput,
  parseLetterDetails,
  validateExplainRequest,
  type AiExplainTask,
} from "@/lib/server/ai-explain";
import { consumeAiCredit, AiRateLimitError, clientIpOf } from "@/lib/server/ai-rate-limit";
import { DeepSeekConfigurationError, DeepSeekUpstreamError, streamChatCompletion } from "@/lib/server/deepseek";

export const runtime = "nodejs";

function textStream(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  try {
    consumeAiCredit(clientIpOf(request));
  } catch (error) {
    if (error instanceof AiRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  const rawTask = body.task;
  const task: AiExplainTask = AI_EXPLAIN_TASKS.find((item) => item === rawTask) ?? "payslip";

  let systemPrompt: string;
  let userPrompt: string;

  if (task === "letter") {
    const details = parseLetterDetails(body);
    if (!details) {
      return NextResponse.json({ error: "请填写事实经过，并选择信件类型。" }, { status: 400 });
    }
    systemPrompt = buildExplainSystemPrompt("letter");
    userPrompt = buildLetterUserPrompt(details);
  } else {
    const input = cleanInput(body.input);
    const error = validateExplainRequest(task, input);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    systemPrompt = buildExplainSystemPrompt(task);
    userPrompt = buildExplainUserPrompt(task, input, cleanInput(body.extra, 300) || undefined);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamChatCompletion([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ])) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (error) {
        const message =
          error instanceof DeepSeekConfigurationError || error instanceof DeepSeekUpstreamError
            ? error.message
            : "生成中断，请稍后重试。";
        if (!(error instanceof DeepSeekConfigurationError) && !(error instanceof DeepSeekUpstreamError)) {
          console.error("[ai-explain] generation failed", error);
        }
        controller.enqueue(encoder.encode(`\n\n⚠️ ${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return textStream(stream);
}
