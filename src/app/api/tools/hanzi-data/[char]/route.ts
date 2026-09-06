import { NextResponse } from "next/server";

/**
 * 汉字字形数据（Hanzi Writer 格式）的同源代理：
 * 客户端只请求本站，服务端按需从上游 CDN 拉取并做内存缓存（数据不可变）。
 * 好处：国内用户不依赖第三方 CDN，且不向第三方暴露访问内容。
 */

const UPSTREAMS = [
  (char: string) => `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`,
  (char: string) => `https://unpkg.com/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`,
];

const CACHE_LIMIT = 800;
const cache = new Map<string, unknown>();

function isValidChar(char: string): boolean {
  return /^[\u3400-\u4dbf\u4e00-\u9fff]$/.test(char);
}

export async function GET(_request: Request, context: { params: Promise<{ char: string }> }) {
  const { char: rawChar } = await context.params;
  const char = decodeURIComponent(rawChar);
  if (!isValidChar(char)) {
    return NextResponse.json({ error: "仅支持单个汉字。" }, { status: 400 });
  }

  const cached = cache.get(char);
  if (cached !== undefined) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "public, max-age=2592000, immutable" } });
  }

  for (const build of UPSTREAMS) {
    try {
      const response = await fetch(build(char), { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) continue;
      const data = (await response.json()) as unknown;
      if (!data || typeof data !== "object" || !Array.isArray((data as { strokes?: unknown }).strokes)) continue;

      if (cache.size > CACHE_LIMIT) cache.clear();
      cache.set(char, data);
      return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=2592000, immutable" } });
    } catch {
      // 尝试下一个上游
    }
  }

  return NextResponse.json({ error: "暂未收录这个字的字形数据。" }, { status: 404 });
}
