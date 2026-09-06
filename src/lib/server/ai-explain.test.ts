import { describe, expect, it } from "vitest";

import {
  buildExplainSystemPrompt,
  buildExplainUserPrompt,
  buildLetterUserPrompt,
  cleanInput,
  parseLetterDetails,
  validateExplainRequest,
} from "@/lib/server/ai-explain";

describe("cleanInput", () => {
  it("trims strings and rejects non-strings", () => {
    expect(cleanInput("  你好 ")).toBe("你好");
    expect(cleanInput(42)).toBe("");
  });
});

describe("validateExplainRequest", () => {
  it("rejects empty inputs with task-specific messages", () => {
    expect(validateExplainRequest("payslip", "")).toContain("工资条");
    expect(validateExplainRequest("checkup", "")).toContain("体检");
    expect(validateExplainRequest("medication", "")).toContain("说明书");
    expect(validateExplainRequest("letter", "")).toContain("事实");
  });

  it("rejects too-short payslip content", () => {
    expect(validateExplainRequest("payslip", "太短")).toContain("完整条目");
    expect(validateExplainRequest("payslip", "基本工资 8000 元，社保扣款 800 元")).toBeNull();
  });
});

describe("prompts", () => {
  it("requires medical disclaimers for checkup prompts", () => {
    const system = buildExplainSystemPrompt("checkup");
    expect(system).toContain("不构成医疗建议");
    expect(buildExplainSystemPrompt("medication")).toContain("遵医嘱");
  });

  it("builds user prompts with optional extra info", () => {
    const prompt = buildExplainUserPrompt("payslip", "工资条内容", "坐标杭州");
    expect(prompt).toContain("工资条内容");
    expect(prompt).toContain("杭州");
  });
});

describe("letter details", () => {
  it("parses and defaults the tone", () => {
    const details = parseLetterDetails({ kind: "complaint", facts: "买的手机三天就坏了" });
    expect(details?.kind).toBe("complaint");
    expect(details?.tone).toBe("restrained");
  });

  it("returns null without kind or facts", () => {
    expect(parseLetterDetails({ facts: "事实" })).toBeNull();
    expect(parseLetterDetails({ kind: "resign" })).toBeNull();
  });

  it("builds different prompts for resign and complaint", () => {
    const resign = buildLetterUserPrompt({ kind: "resign", facts: "个人原因", tone: "formal" });
    expect(resign).toContain("辞职信");
    const complaint = buildLetterUserPrompt({ kind: "complaint", facts: "商家拒绝退货", tone: "firm", demands: "全额退款" });
    expect(complaint).toContain("投诉信");
    expect(complaint).toContain("全额退款");
    expect(complaint).toContain("坚决明确");
  });
});
