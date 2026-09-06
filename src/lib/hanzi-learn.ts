/**
 * 汉字笔顺学习工具的核心逻辑：从语音/输入文本中挑出要学的字，以及本机历史记录。
 */

export const HANZI_LEARN_LIMITS = {
  /** 一次最多展示的候选字数 */
  maxCandidates: 12,
  /** 历史记录上限 */
  maxHistory: 50,
  /** 查询字义时允许的最大字数（词组也能查） */
  maxQueryChars: 6,
} as const;

const CJK_REGEX = /[\u3400-\u4dbf\u4e00-\u9fff]/;

/** 从文本中筛出汉字（去重、保持出现顺序）。 */
export function extractChineseChars(text: string): string[] {
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const char of text) {
    if (!CJK_REGEX.test(char) || seen.has(char)) continue;
    seen.add(char);
    chars.push(char);
    if (chars.length >= HANZI_LEARN_LIMITS.maxCandidates) break;
  }
  return chars;
}

/**
 * 语音识别结果里挑出「孩子最可能要学的字」：
 * 优先取「X的Y」句式里“的”后面的字（如“节约的约”→ 约），
 * 否则取最后一个汉字。找不到返回 null。
 */
export function guessTargetChar(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const afterDe = trimmed.lastIndexOf("的");
  if (afterDe >= 0) {
    for (const char of trimmed.slice(afterDe + 1)) {
      if (CJK_REGEX.test(char)) return char;
    }
  }
  const chars = extractChineseChars(trimmed);
  return chars.length > 0 ? chars[chars.length - 1] : null;
}

/** 过滤出适合查字义的字符串：只保留汉字，限长。 */
export function sanitizeQuery(text: string): string {
  return [...text].filter((char) => CJK_REGEX.test(char)).slice(0, HANZI_LEARN_LIMITS.maxQueryChars).join("");
}

export type HanziHistoryEntry = { char: string; word: string; time: number };

const HISTORY_KEY = "alltools-hanzi-history";

export function loadHistory(): HanziHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HanziHistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.char === "string") : [];
  } catch {
    return [];
  }
}

/** 记录一次学习（同一字去重置顶），返回新列表。 */
export function addToHistory(history: HanziHistoryEntry[], char: string, word: string): HanziHistoryEntry[] {
  const entry: HanziHistoryEntry = { char, word, time: Date.now() };
  const rest = history.filter((item) => item.char !== char);
  return [entry, ...rest].slice(0, HANZI_LEARN_LIMITS.maxHistory);
}
