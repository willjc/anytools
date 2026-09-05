/**
 * AI PPT 生成器的共享模型：输入约束、幻灯片结构、提示词与流式行解析。
 * 该模块必须保持无副作用，便于浏览器与 Node 两侧复用及单元测试。
 */

export const PPT_LIMITS = {
  /** 允许的最大页数（含封面与结尾页） */
  maxSlideCount: 16,
  minSlideCount: 6,
  defaultSlideCount: 10,
  /** 主题 + 粘贴内容的总字符上限，超出会截断 */
  maxInputChars: 8000,
  /** 每页要点数量上限 */
  maxBulletsPerSlide: 6,
  /** 单条文本长度上限（标题 / 要点 / 备注） */
  maxTextChars: 200,
  /** 导出时允许的最大页数，双保险 */
  maxExportSlides: 24,
} as const;

export type SlideLayout = "cover" | "section" | "content" | "closing";

export type Slide = {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  notes?: string;
};

export type DeckMeta = {
  title: string;
  subtitle?: string;
};

export type GenerateRequest = {
  input: string;
  slideCount: number;
  audience?: string;
};

export type GenerateEvent =
  | { type: "meta"; title: string; subtitle?: string }
  | { type: "slide"; slide: Slide }
  | { type: "done"; total: number }
  | { type: "error"; message: string };

export function clampSlideCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PPT_LIMITS.defaultSlideCount;
  return Math.min(PPT_LIMITS.maxSlideCount, Math.max(PPT_LIMITS.minSlideCount, Math.round(parsed)));
}

export function clampInput(value: unknown, limit: number = PPT_LIMITS.maxInputChars): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, limit);
}

function cleanText(value: unknown, limit: number = PPT_LIMITS.maxTextChars): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, limit) : undefined;
}

/**
 * 把模型输出的单个幻灯片对象规整为安全结构；
 * 关键字段缺失时返回 null，由调用方跳过该行。
 */
export function normalizeSlide(value: unknown): Slide | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const layoutRaw = typeof raw.layout === "string" ? raw.layout : "";
  const layout: SlideLayout =
    layoutRaw === "cover" || layoutRaw === "section" || layoutRaw === "closing" ? layoutRaw : "content";

  const title = cleanText(raw.title);
  if (!title) return null;

  const slide: Slide = { layout, title };

  const subtitle = cleanText(raw.subtitle);
  if (subtitle) slide.subtitle = subtitle;

  if (Array.isArray(raw.bullets)) {
    const bullets = raw.bullets
      .map((item) => cleanText(item))
      .filter((item): item is string => Boolean(item))
      .slice(0, PPT_LIMITS.maxBulletsPerSlide);
    if (bullets.length > 0) slide.bullets = bullets;
  }

  const body = cleanText(raw.body, 400);
  if (body) slide.body = body;

  const notes = cleanText(raw.notes, 400);
  if (notes) slide.notes = notes;

  if (layout === "content" && !slide.bullets && !slide.body) return null;
  return slide;
}

export function normalizeMeta(value: unknown): DeckMeta | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const title = cleanText(raw.title, 80);
  if (!title) return null;
  return { title, subtitle: cleanText(raw.subtitle, 120) };
}

/**
 * 解析模型输出的一行：要求每行都是独立 JSON 对象。
 * 封面元信息必须带 layout:"cover"（或同时具备标题与副标题且无正文结构）；
 * 其余按幻灯片规整，无法解析或字段不完整时返回 null。
 */
export function parseDeckLine(line: string): { kind: "meta"; meta: DeckMeta } | { kind: "slide"; slide: Slide } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const raw = parsed as Record<string, unknown>;

  const looksLikeMeta =
    raw.layout === "cover" ||
    (raw.layout === undefined && raw.title !== undefined && raw.subtitle !== undefined && raw.bullets === undefined && raw.body === undefined);
  if (looksLikeMeta) {
    const meta = normalizeMeta(parsed);
    if (meta) return { kind: "meta", meta };
  }
  const slide = normalizeSlide(parsed);
  if (slide) return { kind: "slide", slide };
  return null;
}

export function buildDeckSystemPrompt(slideCount: number): string {
  return [
    "你是一位资深 PPT 策划与撰稿人，为中文职场汇报设计结构清晰、信息密度合适的幻灯片。",
    "输出要求（必须严格遵守）：",
    `1. 输出 JSON Lines：每一行都是独立的 JSON 对象，不要输出数组、Markdown 代码块或任何其他文字。`,
    `2. 第 1 行是封面元信息：{"layout":"cover","title":"演示文稿标题","subtitle":"副标题"}。`,
    "3. 之后每行是一页幻灯片：",
    `   - 章节过渡页：{"layout":"section","title":"章节名"}`,
    `   - 内容页：{"layout":"content","title":"页标题","bullets":["要点1","要点2"],"notes":"演讲备注，可选"}`,
    `   - 结尾页：{"layout":"closing","title":"谢谢观看","body":"一句收尾或行动号召"}`,
    "4. 每条要点不超过 40 字，语言精炼具体，多用短句和量化表达，不要空话套话。",
    `5. 总共输出 ${slideCount} 行左右（含封面与结尾页），结构建议：封面、章节过渡（视页数 1-2 个）、内容页若干、结尾页。`,
    "6. 不要编造具体数据；若主题需要数据，用「待补充：……」占位。",
  ].join("\n");
}

export function buildDeckUserPrompt(input: string, slideCount: number, audience?: string): string {
  const audienceLine = audience ? `演示场合与受众：${audience}。` : "演示场合：通用职场汇报。";
  return [
    `请为以下主题制作一份 ${slideCount} 页左右的 PPT。`,
    audienceLine,
    `主题与素材：`,
    "```",
    input,
    "```",
  ].join("\n");
}
