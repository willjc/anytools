/**
 * 滚动大字屏配置与循环计算。纯函数，便于单元测试。
 */

export const MARQUEE_LIMITS = {
  maxTextChars: 60,
} as const;

export type MarqueeThemeId = "pickup" | "taxi" | "neon" | "plain";

export const MARQUEE_THEMES: readonly { id: MarqueeThemeId; name: string; bg: string; color: string }[] = [
  { id: "pickup", name: "接机 · 白底红字", bg: "#ffffff", color: "#c22a20" },
  { id: "taxi", name: "车屏 · 黑底黄字", bg: "#151412", color: "#ffd400" },
  { id: "neon", name: "荧光 · 黑底绿字", bg: "#0c1210", color: "#4ade80" },
  { id: "plain", name: "素雅 · 白底黑字", bg: "#fbfbfa", color: "#21201c" },
] as const;

export type MarqueeSpeedId = "slow" | "normal" | "fast";

/** 每秒滚动像素（基准 1080 宽画面） */
export const MARQUEE_SPEEDS: readonly { id: MarqueeSpeedId; name: string; pxPerSecond: number }[] = [
  { id: "slow", name: "慢", pxPerSecond: 90 },
  { id: "normal", name: "中", pxPerSecond: 180 },
  { id: "fast", name: "快", pxPerSecond: 320 },
] as const;

export type MarqueeDirectionId = "left" | "right" | "static";

export const MARQUEE_DIRECTIONS: readonly { id: MarqueeDirectionId; name: string }[] = [
  { id: "left", name: "向左滚动" },
  { id: "right", name: "向右滚动" },
  { id: "static", name: "静止举牌" },
] as const;

export type MarqueeFontSizeId = "medium" | "large" | "huge";

export const MARQUEE_FONT_SIZES: readonly { id: MarqueeFontSizeId; name: string; px: number }[] = [
  { id: "medium", name: "中", px: 96 },
  { id: "large", name: "大", px: 150 },
  { id: "huge", name: "特大", px: 220 },
] as const;

export function marqueeThemeOf(id: MarqueeThemeId): { bg: string; color: string } {
  return MARQUEE_THEMES.find((item) => item.id === id) ?? MARQUEE_THEMES[0];
}

export function marqueeSpeedOf(id: MarqueeSpeedId): number {
  return (MARQUEE_SPEEDS.find((item) => item.id === id) ?? MARQUEE_SPEEDS[1]).pxPerSecond;
}

export function marqueeFontSizeOf(id: MarqueeFontSizeId): number {
  return (MARQUEE_FONT_SIZES.find((item) => item.id === id) ?? MARQUEE_FONT_SIZES[1]).px;
}

/**
 * 计算无缝循环需要的文本副本数量：
 * 至少 2 份，且总宽度要能盖住可视区宽度。
 */
export function copyCountNeeded(textWidth: number, viewportWidth: number): number {
  if (textWidth <= 0) return 1;
  const copies = Math.ceil((viewportWidth + textWidth) / textWidth);
  return Math.max(2, Math.min(copies, 20));
}

/** 单步推进偏移量（像素），并做无缝回绕。direction 为 static 时原样返回。 */
export function advanceOffset(offset: number, direction: MarqueeDirectionId, pxPerSecond: number, spanWidth: number, deltaSeconds: number): number {
  if (direction === "static" || spanWidth <= 0) return 0;
  let next = direction === "left" ? offset - pxPerSecond * deltaSeconds : offset + pxPerSecond * deltaSeconds;
  if (direction === "left" && next <= -spanWidth) next += spanWidth;
  if (direction === "right" && next >= 0) next -= spanWidth;
  return next;
}

/** 静止举牌：从基准字号逐步缩小直到单行放得下（保留 5% 边距抵消渲染差异）。 */
export function fitStaticFontSize(text: string, basePx: number, measure: (size: number) => number, maxWidth: number): number {
  if (!text) return basePx;
  let size = basePx;
  while (size > 28 && measure(size) > maxWidth * 0.95) {
    size = Math.max(28, Math.floor(size * 0.9));
  }
  return size;
}
