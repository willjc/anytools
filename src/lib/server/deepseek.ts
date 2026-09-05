/**
 * DeepSeek Chat API 客户端（OpenAI 兼容协议）。
 * 仅在服务端使用；密钥通过 DEEPSEEK_API_KEY 环境变量注入，绝不写入代码。
 */

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";
const REQUEST_TIMEOUT_MS = 3 * 60 * 1000;

export class DeepSeekConfigurationError extends Error {
  constructor() {
    super("服务器尚未配置 AI 服务，该功能暂不可用。");
    this.name = "DeepSeekConfigurationError";
  }
}

export class DeepSeekUpstreamError extends Error {
  constructor(message = "AI 服务暂时不可用，请稍后重试。") {
    super(message);
    this.name = "DeepSeekUpstreamError";
  }
}

export type ChatMessage = { role: "system" | "user"; content: string };

function resolveApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new DeepSeekConfigurationError();
  return key;
}

/**
 * 以 SSE 流式调用 chat/completions，逐段产出增量文本。
 * 网络中断或上游报错时抛出 DeepSeekUpstreamError。
 */
export async function* streamChatCompletion(messages: ChatMessage[], options: { temperature?: number; maxTokens?: number } = {}): AsyncGenerator<string> {
  const apiKey = resolveApiKey();
  const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 8000,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new DeepSeekUpstreamError("AI 生成超时，请减少页数后重试。");
    }
    throw new DeepSeekUpstreamError();
  }

  if (!response.ok || !response.body) {
    const status = response.status;
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 300);
    } catch {
      // ignore body read failures
    }
    console.error(`[deepseek] upstream ${status}`, detail);
    throw new DeepSeekUpstreamError(status === 401 || status === 403 ? "AI 服务鉴权失败，请检查服务端配置。" : undefined);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n");
      while (separatorIndex >= 0) {
        const line = buffer.slice(0, separatorIndex).trim();
        buffer = buffer.slice(separatorIndex + 1);
        separatorIndex = buffer.indexOf("\n");
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const chunk = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // 跳过无法解析的心跳/注释行
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new DeepSeekUpstreamError("AI 生成超时，请稍后重试。");
    throw error instanceof DeepSeekUpstreamError ? error : new DeepSeekUpstreamError();
  }
}
