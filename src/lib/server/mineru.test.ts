import { afterEach, describe, expect, it, vi } from "vitest";

import { convertWithMineru } from "@/lib/server/mineru";

describe("convertWithMineru", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MINERU_API_TOKEN;
  });

  it("rejects an insecure upload URL returned by the API", async () => {
    process.env.MINERU_API_TOKEN = "test-token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      data: { batch_id: "batch-1", file_urls: ["http://127.0.0.1/upload"] },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    await expect(convertWithMineru("demo.pdf", new Uint8Array([1]))).rejects.toThrow("不安全的上传地址");
  });
});
