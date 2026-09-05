"use client";

import "@fontsource/ma-shan-zheng/index.css";
import "@fontsource/noto-serif-sc/index.css";
import "@fontsource/long-cang/index.css";
import "@fontsource/zhi-mang-xing/index.css";

import { useEffect, useRef, useState } from "react";
import { Check, Download, LoaderCircle, Type } from "lucide-react";

import {
  ACCENT_OPTIONS,
  accentColorOf,
  FONT_OPTIONS,
  fontOptionOf,
  LAYOUT_OPTIONS,
  normalizeBodyText,
  TEXT_IMAGE_LIMITS,
  wrapText,
  type AccentId,
  type FontId,
  type LayoutId,
} from "@/lib/text-image";

const INK = "#21201c";
const INK_SOFT = "#5f5d56";
const HAIRLINE = "#e7e4df";
const PAPER = "#fbfbfa";
const DARK_PAPER = "#f6f2e9";

type DrawState = {
  title: string;
  body: string;
  signature: string;
  layout: LayoutId;
  font: FontId;
  accent: AccentId;
};

/** 横排版式的视觉与排版参数 */
function palette(state: DrawState) {
  const accent = accentColorOf(state.accent);
  switch (state.layout) {
    case "card":
      return { bg: "#ffffff", ink: INK, sub: INK_SOFT, pad: 88, titleSize: 56, bodySize: 34, lineHeight: 60, paraGap: 30, indent: false, frame: HAIRLINE, accent };
    case "dark":
      return { bg: "#211f1b", ink: "#f5f1e8", sub: "rgba(245,241,232,0.62)", pad: 88, titleSize: 54, bodySize: 34, lineHeight: 62, paraGap: 30, indent: false, frame: "rgba(245,241,232,0.16)", accent };
    default:
      return { bg: PAPER, ink: INK, sub: INK_SOFT, pad: 96, titleSize: 52, bodySize: 34, lineHeight: 64, paraGap: 26, indent: true, frame: HAIRLINE, accent };
  }
}

function setFont(ctx: CanvasRenderingContext2D, size: number, family: string) {
  ctx.font = `${size}px ${family}`;
}

/** 竖排：返回列内容与画布宽度 */
function buildVerticalColumns(state: DrawState, charsPerColumn: number): { columns: string[][]; titleColumn: string[]; signatureColumn: string[] } {
  const titleColumn = [...state.title];
  const bodyColumns: string[][] = [];
  let current: string[] = [];
  for (const char of state.body.replace(/\n+/g, "\n")) {
    if (char === "\n") {
      bodyColumns.push(current);
      current = [];
      continue;
    }
    current.push(char);
    if (current.length >= charsPerColumn) {
      bodyColumns.push(current);
      current = [];
    }
  }
  if (current.length) bodyColumns.push(current);
  const signatureColumn = [...state.signature];
  return { columns: bodyColumns, titleColumn, signatureColumn };
}

function renderHorizontal(canvas: HTMLCanvasElement, state: DrawState, fontFamily: string): { truncated: boolean } {
  const p = palette(state);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { truncated: false };
  const W = TEXT_IMAGE_LIMITS.canvasWidth;
  const contentWidth = W - p.pad * 2;

  setFont(ctx, p.bodySize, fontFamily);
  const measure = (value: string) => ctx.measureText(value).width;
  const paragraphs = state.body.split("\n");
  const indentWidth = p.indent ? p.bodySize * 2 : 0;

  let truncated = false;
  const blocks: string[][] = [];
  let usedHeight = 0;
  const titleBlockHeight = state.title ? p.titleSize + 46 : 0;
  const signatureBlockHeight = state.signature ? p.bodySize + 26 : 0;

  for (const paragraph of paragraphs) {
    const lines = paragraph.trim() === "" ? [""] : wrapText(paragraph, measure, contentWidth - indentWidth);
    const blockHeight = lines.length * p.lineHeight + (blocks.length ? p.paraGap : 0);
    if (usedHeight + blockHeight > TEXT_IMAGE_LIMITS.maxCanvasHeight - p.pad * 2 - titleBlockHeight - signatureBlockHeight) {
      truncated = true;
      break;
    }
    blocks.push(lines);
    usedHeight += blockHeight;
  }

  const height = Math.min(
    TEXT_IMAGE_LIMITS.maxCanvasHeight,
    p.pad * 2 + titleBlockHeight + usedHeight + signatureBlockHeight,
  );
  canvas.width = W;
  canvas.height = Math.max(height, 420);

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 版式边框
  if (state.layout === "paper") {
    ctx.strokeStyle = p.frame;
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, W - 84, canvas.height - 84);
    ctx.strokeRect(52, 52, W - 104, canvas.height - 104);
  } else if (state.layout === "dark") {
    ctx.strokeStyle = p.frame;
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, W - 88, canvas.height - 88);
  } else {
    ctx.strokeStyle = p.frame;
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, W - 56, canvas.height - 56);
  }

  let cursorY = p.pad;
  if (state.title) {
    setFont(ctx, p.titleSize, fontFamily);
    ctx.textBaseline = "top";
    ctx.fillStyle = p.ink;
    const titleText = state.title.length > 24 ? `${state.title.slice(0, 24)}…` : state.title;
    ctx.fillText(titleText, p.pad, cursorY);
    cursorY += p.titleSize + 14;
    ctx.fillStyle = p.accent;
    ctx.fillRect(p.pad, cursorY, 68, 8);
    cursorY += 32;
  }

  setFont(ctx, p.bodySize, fontFamily);
  ctx.textBaseline = "top";
  ctx.fillStyle = p.ink;
  blocks.forEach((lines, blockIndex) => {
    if (blockIndex > 0) cursorY += p.paraGap;
    lines.forEach((line, lineIndex) => {
      const indent = p.indent && lineIndex === 0 ? indentWidth : 0;
      ctx.fillText(line, p.pad + indent, cursorY);
      cursorY += p.lineHeight;
    });
  });

  if (state.signature) {
    setFont(ctx, 30, fontFamily);
    ctx.fillStyle = p.sub;
    const signatureWidth = Math.min(ctx.measureText(state.signature).width, contentWidth);
    ctx.fillText(state.signature, W - p.pad - signatureWidth, cursorY + 24);
  }

  return { truncated };
}

function renderVertical(canvas: HTMLCanvasElement, state: DrawState, fontFamily: string): { truncated: boolean } {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { truncated: false };
  const accent = accentColorOf(state.accent);
  const pad = 96;
  const H = 1360;
  const bodySize = 38;
  const charGap = 16;
  const columnGap = 36;
  const titleSize = 58;
  const charsPerColumn = Math.floor((H - pad * 2 - 40) / (bodySize + charGap));
  const { columns, titleColumn, signatureColumn } = buildVerticalColumns(state, charsPerColumn);

  const maxColumns = 34;
  const visible = columns.slice(0, maxColumns);
  const truncated = columns.length > maxColumns;
  const titleColumnWidth = state.title ? titleSize + 44 : 0;
  const width = Math.min(
    TEXT_IMAGE_LIMITS.maxCanvasHeight,
    pad * 2 + titleColumnWidth + visible.length * (bodySize + columnGap) + (state.signature ? (bodySize + columnGap) * 2 : 0),
  );

  canvas.width = Math.round(width);
  canvas.height = H;
  ctx.fillStyle = DARK_PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, H - 80);
  ctx.strokeRect(50, 50, canvas.width - 100, H - 100);

  ctx.textBaseline = "top";
  let x = canvas.width - pad - bodySize;

  if (state.title) {
    setFont(ctx, titleSize, fontFamily);
    ctx.fillStyle = accent;
    titleColumn.slice(0, 20).forEach((char, index) => {
      ctx.fillText(char, x - (titleSize - bodySize) / 2, pad + 30 + index * (titleSize + 18));
    });
    x -= titleColumnWidth;
  }

  setFont(ctx, bodySize, fontFamily);
  ctx.fillStyle = INK;
  for (const column of visible) {
    column.forEach((char, index) => {
      ctx.fillText(char, x, pad + 20 + index * (bodySize + charGap));
    });
    x -= bodySize + columnGap;
  }

  if (state.signature) {
    setFont(ctx, 32, fontFamily);
    ctx.fillStyle = INK_SOFT;
    signatureColumn.slice(0, 12).forEach((char, index) => {
      ctx.fillText(char, x, pad + 20 + index * (32 + charGap));
    });
    // 落款印章
    const sealSize = 58;
    const sealX = x - 8;
    const sealY = pad + 20 + Math.min(signatureColumn.length, 12) * (32 + charGap) + 18;
    ctx.fillStyle = accent;
    ctx.fillRect(sealX, sealY, sealSize, sealSize);
    ctx.fillStyle = "#fbfbfa";
    ctx.fillText("印", sealX + 11, sealY + 12);
  }

  return { truncated };
}

async function ensureFontLoaded(cssFamily: string, sample: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.load(`34px ${cssFamily}`, sample);
    await document.fonts.ready;
  } catch {
    // 字体加载失败时按回退字体渲染
  }
}

export function TextImageWorkbench() {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [signature, setSignature] = useState("");
  const [layout, setLayout] = useState<LayoutId>("paper");
  const [font, setFont] = useState<FontId>("system");
  const [accent, setAccent] = useState<AccentId>("emerald");
  const [isRendering, setIsRendering] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const state: DrawState = {
        title: title.trim().slice(0, TEXT_IMAGE_LIMITS.maxTitleChars),
        body: normalizeBodyText(body),
        signature: signature.trim().slice(0, TEXT_IMAGE_LIMITS.maxSignatureChars),
        layout,
        font,
        accent,
      };
      const cssFamily = fontOptionOf(font).cssFamily;
      if (fontOptionOf(font).loaded) {
        setIsRendering(true);
        await ensureFontLoaded(cssFamily, `${state.title}${state.body}${state.signature}印`);
      }
      const { truncated } = layout === "vertical" ? renderVertical(canvas, state, cssFamily) : renderHorizontal(canvas, state, cssFamily);
      setIsRendering(false);
      setNotice(
        truncated
          ? layout === "vertical"
            ? "文字较多，竖排最多显示 34 列，建议精简后再生成。"
            : "文字较多，长图已达高度上限，仅保留前一部分。"
          : null,
      );
    }, 260);
    return () => window.clearTimeout(timer);
  }, [body, title, signature, layout, font, accent]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      setNotice("导出失败，请重试。");
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.trim().replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "文字长图"}.png`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("长图已开始下载，可直接发布到微博 / 朋友圈。");
  }

  async function copyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotice("当前浏览器不支持复制图片，请使用下载。");
    }
  }

  const charCount = normalizeBodyText(body).length;

  return (
    <section aria-label="文字长图生成工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fef7d6] text-amber-800">
            <Type aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地生成 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">文字长图生成器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">微博 / 朋友圈长图</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="text-image-body">
              正文
            </label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              id="text-image-body"
              onChange={(event) => setBody(normalizeBodyText(event.target.value))}
              placeholder={"在这里粘贴或输入长文字，右侧实时预览。\n空行分段；建议 3000 字以内。"}
              rows={9}
              value={body}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{charCount} / {TEXT_IMAGE_LIMITS.maxChars} 字</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="text-image-title">
                标题（可选）
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                id="text-image-title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="一句话点题"
                type="text"
                value={title}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="text-image-signature">
                落款（可选）
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                id="text-image-signature"
                onChange={(event) => setSignature(event.target.value)}
                placeholder="署名或日期"
                type="text"
                value={signature}
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">版式</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LAYOUT_OPTIONS.map((item) => (
                <button
                  aria-pressed={layout === item.id}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    layout === item.id
                      ? "border-emerald-700 bg-emerald-50"
                      : "border-slate-300 bg-white hover:border-emerald-500"
                  }`}
                  key={item.id}
                  onClick={() => setLayout(item.id)}
                  type="button"
                >
                  <span className={`block text-sm font-semibold ${layout === item.id ? "text-emerald-800" : "text-slate-900"}`}>{item.name}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-slate-500">{item.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">
              字体 <span className="text-xs font-normal text-slate-400">开源字体（OFL 协议），首次选择需加载</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FONT_OPTIONS.map((item) => (
                <button
                  aria-pressed={font === item.id}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    font === item.id
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"
                  }`}
                  key={item.id}
                  onClick={() => setFont(item.id)}
                  style={font === item.id ? undefined : { fontFamily: item.cssFamily }}
                  type="button"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">强调色</legend>
            <div className="mt-2 flex gap-2">
              {ACCENT_OPTIONS.map((item) => (
                <button
                  aria-label={item.name}
                  aria-pressed={accent === item.id}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    accent === item.id ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"
                  }`}
                  key={item.id}
                  onClick={() => setAccent(item.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="size-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={charCount === 0 || isRendering}
              onClick={() => void download()}
              type="button"
            >
              <Download aria-hidden="true" className="size-4" />
              下载 PNG 长图
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
              disabled={charCount === 0 || isRendering}
              onClick={() => void copyImage()}
              type="button"
            >
              {copied ? <Check aria-hidden="true" className="size-4" /> : null}
              {copied ? "已复制到剪贴板" : "复制图片"}
            </button>
            {isRendering && (
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                正在加载字体…
              </span>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500">全部生成在浏览器本地完成，文字不会上传；竖排版式适合 300 字以内的短文。</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">实时预览</p>
          <div className="mt-2 max-h-[46rem] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <canvas className="h-auto w-full" ref={canvasRef} />
          </div>
          {notice && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="status">
              {notice}
            </p>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {charCount === 0 ? "在左侧输入或粘贴文字，右侧会实时生成长图预览。\n" : `已生成 ${charCount} 字长图，可下载 PNG 或直接复制到剪贴板。`}
      </p>
    </section>
  );
}
