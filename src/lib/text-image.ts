/**
 * 「文字长图生成器」的排版核心：版式 / 字体 / 强调色配置，
 * 以及带避头尾规则的 CJK 换行算法。本模块为纯函数，便于单元测试。
 * 画布渲染在 workbench 组件中完成（浏览器本地，不上传）。
 */

export const TEXT_IMAGE_LIMITS = {
  /** 导出画布宽度（2x 清晰度，适合微博 / 朋友圈查看） */
  canvasWidth: 1080,
  /** 画布最大高度，超出截断并提示 */
  maxCanvasHeight: 14000,
  maxChars: 3000,
  maxTitleChars: 40,
  maxSignatureChars: 30,
} as const;

export type LayoutId = "paper" | "card" | "vertical" | "dark";

export const LAYOUT_OPTIONS: readonly { id: LayoutId; name: string; description: string }[] = [
  { id: "paper", name: "素笺", description: "暖纸信笺，首行缩进，适合随笔" },
  { id: "card", name: "卡片", description: "白底卡片，现代简洁，适合观点" },
  { id: "vertical", name: "竖排", description: "古籍自右向左，配毛笔字最佳" },
  { id: "dark", name: "墨色", description: "深底浅字，金句语气" },
] as const;

export type FontId = "system" | "serif" | "kai" | "xing" | "shou";

export const FONT_OPTIONS: readonly { id: FontId; name: string; cssFamily: string; loaded: boolean }[] = [
  { id: "system", name: "系统黑体", cssFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif", loaded: false },
  { id: "serif", name: "思源宋体", cssFamily: "'Noto Serif SC', 'Songti SC', 'SimSun', serif", loaded: true },
  { id: "kai", name: "毛笔楷书", cssFamily: "'Ma Shan Zheng', 'Kaiti SC', 'STKaiti', 'KaiTi', serif", loaded: true },
  { id: "xing", name: "行书", cssFamily: "'Zhi Mang Xing', 'Kaiti SC', 'STKaiti', cursive", loaded: true },
  { id: "shou", name: "龙藏手写", cssFamily: "'Long Cang', 'Kaiti SC', 'STKaiti', cursive", loaded: true },
] as const;

export type AccentId = "emerald" | "cinnabar" | "indigo";

export const ACCENT_OPTIONS: readonly { id: AccentId; name: string; color: string }[] = [
  { id: "emerald", name: "翠", color: "#047857" },
  { id: "cinnabar", name: "朱", color: "#B4232A" },
  { id: "indigo", name: "黛", color: "#2F4B72" },
] as const;

export function fontOptionOf(id: FontId): (typeof FONT_OPTIONS)[number] {
  return FONT_OPTIONS.find((item) => item.id === id) ?? FONT_OPTIONS[0];
}

export function accentColorOf(id: AccentId): string {
  return (ACCENT_OPTIONS.find((item) => item.id === id) ?? ACCENT_OPTIONS[0]).color;
}

/** 不允许出现在行首的字符（避头） */
const NO_LINE_START = "。，、；：？！）》〉」』】”’％%,.;:?!)]}…‥·~";
/** 不允许出现在行尾的字符（避尾） */
const NO_LINE_END = "（〈「『【“‘([{";

/** 把文本切成可断行的单元：连续的 ASCII 字母数字作为一个词，其余逐字。 */
export function tokenizeLine(text: string): string[] {
  const units: string[] = [];
  let buffer = "";
  for (const char of text) {
    if (/[A-Za-z0-9@#$&+=/_.'-]/.test(char)) {
      buffer += char;
    } else {
      if (buffer) {
        units.push(buffer);
        buffer = "";
      }
      units.push(char);
    }
  }
  if (buffer) units.push(buffer);
  return units;
}

/**
 * 贪心换行 + 避头尾：
 * - 断行落在避头字符（句号逗号等）之前时，把上一单元一起带回下一行；
 * - 行尾是避尾字符（开括号引号等）时，把它移到下一行。
 * measure 为测量函数（通常绑定 canvas measureText），返回文本宽度。
 */
export function wrapText(text: string, measure: (value: string) => number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    const trimmed = paragraph.replace(/\s+$/g, "");
    if (trimmed.trim() === "") {
      lines.push("");
      continue;
    }

    let line = "";
    for (const unit of tokenizeLine(trimmed)) {
      if (line !== "" && measure(line + unit) <= maxWidth) {
        line += unit;
        continue;
      }
      if (line === "" && measure(unit) <= maxWidth) {
        line = unit;
        continue;
      }
      if (line === "") {
        // 单个单元超宽（如超长网址）：按宽度硬切
        let chunk = "";
        for (const char of unit) {
          if (chunk !== "" && measure(chunk + char) > maxWidth) {
            lines.push(chunk);
            chunk = char;
          } else {
            chunk += char;
          }
        }
        line = chunk;
        continue;
      }

      // 需要断行：先处理避尾，再回拉避头
      let carry = unit;
      let current = line;
      while (current.length > 1 && NO_LINE_END.includes(current[current.length - 1])) {
        carry = current[current.length - 1] + carry;
        current = current.slice(0, -1);
      }
      while (carry.length > 0 && NO_LINE_START.includes(carry[0]) && current.length > 1) {
        const start = findLastUnitStart(current);
        if (start <= 0) break;
        carry = current.slice(start) + carry;
        current = current.slice(0, start);
      }
      lines.push(current);
      line = carry;
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** 找到行尾最后一个排版单元（词或字）的起始下标。 */
function findLastUnitStart(line: string): number {
  let index = line.length - 1;
  if (/[A-Za-z0-9@#$&+=/_.'-]/.test(line[index])) {
    while (index > 0 && /[A-Za-z0-9@#$&+=/_.'-]/.test(line[index - 1])) index -= 1;
    return index;
  }
  return line.length - 1;
}

/** 清理用户输入：统一换行、截断超限、去掉行尾多余空白。 */
export function normalizeBodyText(value: string, limit: number = TEXT_IMAGE_LIMITS.maxChars): string {
  return value.replace(/\r\n?/g, "\n").slice(0, limit);
}
