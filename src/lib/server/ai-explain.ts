/**
 * AI 解读 / 起草任务的提示词与输入校验。
 * 四个任务：工资条解读、体检报告解读、药品说明书大白话、信函起草（辞职信/投诉信）。
 */

export const AI_EXPLAIN_TASKS = ["payslip", "checkup", "medication", "letter"] as const;
export type AiExplainTask = (typeof AI_EXPLAIN_TASKS)[number];

export const AI_EXPLAIN_LIMITS = {
  maxInputChars: 6000,
  maxFieldChars: 300,
} as const;

export type LetterKind = "resign" | "complaint";

export type LetterDetails = {
  kind: LetterKind;
  recipient?: string;
  writer?: string;
  facts: string;
  demands?: string;
  tone: "restrained" | "formal" | "firm";
};

const TONE_LABELS: Record<LetterDetails["tone"], string> = {
  restrained: "克制礼貌",
  formal: "正式规范",
  firm: "坚决明确",
};

export function cleanInput(value: unknown, limit: number = AI_EXPLAIN_LIMITS.maxInputChars): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function validateExplainRequest(task: AiExplainTask, input: string): string | null {
  if (!input) {
    const emptyMessages: Record<Exclude<AiExplainTask, "letter">, string> = {
      payslip: "请先粘贴工资条内容。",
      checkup: "请先粘贴体检报告指标。",
      medication: "请先粘贴药品说明书内容。",
    };
    return task === "letter" ? "请填写事实经过。" : emptyMessages[task];
  }
  if (task === "payslip" && input.length < 20) return "工资条内容太短，请粘贴完整条目（如：基本工资 8000、社保 -800…）。";
  if (task === "checkup" && input.length < 10) return "请粘贴体检报告中的指标内容。";
  if (task === "medication" && input.length < 10) return "请粘贴药品说明书内容或填写药名与用法。";
  return null;
}

export function buildExplainSystemPrompt(task: AiExplainTask): string {
  switch (task) {
    case "payslip":
      return [
        "你是薪酬与社保合规专家，帮普通上班族解读工资条。",
        "输出 Markdown，包含以下小节：① 逐项解释（每一栏是什么、为什么扣）；② 扣款核对（按常识估算社保公积金个税是否在合理区间，指出明显异常项）；③ 到手金额分析；④ 建议（该问 HR 什么）。",
        "规则：基数与比例各地不同，估算时说明假设；不确定就说不确定；不要编造具体政策数字；语气通俗。",
      ].join("\n");
    case "checkup":
      return [
        "你是体检报告解读助手，帮普通人看懂体检指标。",
        "输出 Markdown，包含：① 指标逐条解读（正常/偏高/偏低各代表什么常见原因）；② 需要重视的项目排序（轻/中/重）；③ 建议的复查或生活方式调整；④ 需要尽快就医的警示信号（如有）。",
        "规则：只能基于常见医学常识，每个异常指标标注『常见原因』而非下诊断；开头与结尾必须强调：本解读不构成医疗建议，仅供参考，请以医生诊断为准。",
      ].join("\n");
    case "medication":
      return [
        "你是用药指导转译助手，把药品说明书翻译成大白话。",
        "输出 Markdown，固定小节：① 这个药治什么；② 怎么吃（每次多少、一天几次、饭前/饭后/随餐）；③ 忘了吃怎么办；④ 不能和什么一起吃/忌口；⑤ 常见副作用与停药信号；⑥ 特殊人群提示（孕妇/儿童/肝肾功能不全）。",
        "规则：严格基于说明书内容转述，不添加说明书以外的用药建议；结尾强调：请遵医嘱及说明书，有疑问咨询医生或药师。",
      ].join("\n");
    case "letter":
      return "你是职场文书助手，根据用户提供的事实起草书信。输出正文即可（可含标题与落款占位），不要输出解释或 Markdown 代码块。";
  }
}

export function buildExplainUserPrompt(task: AiExplainTask, input: string, extra?: string): string {
  const extraLine = extra ? `\n补充信息：${extra}` : "";
  switch (task) {
    case "payslip":
      return `请解读以下工资条内容：\n\n${input}${extraLine}`;
    case "checkup":
      return `请解读以下体检报告指标：\n\n${input}${extraLine}`;
    case "medication":
      return `请把以下药品说明书转成大白话：\n\n${input}${extraLine}`;
    case "letter":
      return input;
  }
}

export function buildLetterUserPrompt(details: LetterDetails): string {
  const kindText =
    details.kind === "resign"
      ? "一封辞职信。要求：表明离职意愿与最后工作日意向（未给出则用占位日期）、简短致谢、承诺交接，不写负面情绪、不解释过多细节。"
      : "一封投诉信（面向 12345 / 消协 / 平台客服）。要求：事实经过按时间线陈述、指出对方问题、明确诉求（赔偿/退款/整改等，未给出则合理设定占位）、附上希望的处理期限；有理有据、不辱骂不夸张。";
  const parts = [
    `请起草${kindText}。语气：${TONE_LABELS[details.tone]}。`,
    details.recipient ? `收件方：${details.recipient}。` : "",
    details.writer ? `落款人身份：${details.writer}。` : "",
    `事实经过：\n${details.facts}`,
    details.demands ? `我的诉求：${details.demands}` : "",
  ];
  return parts.filter(Boolean).join("\n\n");
}

export function parseLetterDetails(body: Record<string, unknown>): LetterDetails | null {
  const kind = body.kind === "resign" || body.kind === "complaint" ? body.kind : null;
  const facts = cleanInput(body.facts, AI_EXPLAIN_LIMITS.maxInputChars);
  if (!kind || !facts) return null;
  const tone = body.tone === "formal" || body.tone === "firm" ? body.tone : "restrained";
  return {
    kind,
    facts,
    tone,
    recipient: cleanInput(body.recipient, AI_EXPLAIN_LIMITS.maxFieldChars) || undefined,
    writer: cleanInput(body.writer, AI_EXPLAIN_LIMITS.maxFieldChars) || undefined,
    demands: cleanInput(body.demands, AI_EXPLAIN_LIMITS.maxFieldChars) || undefined,
  };
}
