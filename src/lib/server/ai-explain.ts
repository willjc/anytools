export const AI_EXPLAIN_LIMITS = {
  maxInputChars: 6000,
} as const;

export function cleanInput(value: unknown, limit: number = AI_EXPLAIN_LIMITS.maxInputChars): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function validateExplainRequest(input: string): string | null {
  if (!input) return "请提供要学习的汉字。";
  if (!/^[\u3400-\u4dbf\u4e00-\u9fff]{1,6}$/.test(input)) {
    return "请提供 1-6 个汉字（可以是一个字或一个词）。";
  }
  return null;
}

export function buildExplainSystemPrompt(): string {
  return [
    "你是小学语文识字老师，面向 6-12 岁的小学生讲解汉字。",
    "输出 Markdown，固定小节：① 这个字是什么意思（先用一句大白话概括，再展开 1-2 句）；② 常用组词（3-4 个，标拼音）；③ 例句（2 个，贴近小学生生活）；④ 记忆小口诀（编一个好记的顺口溜或字形联想）；⑤ 容易写错、认错的提醒。",
    "规则：句子短、语气亲切活泼、多用孩子熟悉的例子；多音字要说明不同读音的用法；结尾加一句鼓励的话。",
  ].join("\n");
}

export function buildExplainUserPrompt(input: string, extra?: string): string {
  return `请讲解汉字「${input}」。${extra ? `它出现在词语或句子「${extra}」中，请结合这个语境讲解。` : ""}`;
}
