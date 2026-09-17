import { describe, expect, it } from "vitest";

import {
  buildExplainSystemPrompt,
  buildExplainUserPrompt,
  cleanInput,
  validateExplainRequest,
} from "@/lib/server/ai-explain";

describe("cleanInput", () => {
  it("trims strings and rejects non-strings", () => {
    expect(cleanInput("  你好 ")).toBe("你好");
    expect(cleanInput(42)).toBe("");
  });
});

describe("hanzi task", () => {
  it("validates cjk-only short input", () => {
    expect(validateExplainRequest("约")).toBeNull();
    expect(validateExplainRequest("节约")).toBeNull();
    expect(validateExplainRequest("abc")).toContain("1-6 个汉字");
    expect(validateExplainRequest("")).toContain("汉字");
  });

  it("explains with word context from extra", () => {
    const prompt = buildExplainUserPrompt("约", "节约的约");
    expect(prompt).toContain("「约」");
    expect(prompt).toContain("节约的约");
    const system = buildExplainSystemPrompt();
    expect(system).toContain("识字老师");
    expect(system).toContain("记忆小口诀");
  });
});
