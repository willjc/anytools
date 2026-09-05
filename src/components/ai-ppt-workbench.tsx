"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileText, LoaderCircle, Presentation, RefreshCw, Sparkles, SquareX } from "lucide-react";

import { PPT_LIMITS, type DeckMeta, type GenerateEvent, type Slide } from "@/lib/ai-ppt";

const SLIDE_COUNT_OPTIONS = [6, 8, 10, 12, 14, 16];

type Phase = "idle" | "streaming" | "done";

function MiniSlide({ slide, index }: { slide: Slide; index: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5">
        <span className="text-xs font-medium text-slate-400">第 {index} 页</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          {slide.layout === "cover" ? "封面" : slide.layout === "section" ? "章节页" : slide.layout === "closing" ? "结尾页" : "内容页"}
        </span>
      </div>
      <div className="aspect-[16/9] w-full px-4 py-3 sm:px-5">
        {slide.layout === "cover" && (
          <div className="flex h-full flex-col justify-center">
            <span className="mb-2 block h-1 w-8 rounded-full bg-emerald-700" />
            <p className="text-base font-semibold leading-snug tracking-tight text-slate-950 sm:text-lg">{slide.title}</p>
            {slide.subtitle && <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:text-sm">{slide.subtitle}</p>}
          </div>
        )}
        {slide.layout === "section" && (
          <div className="flex h-full flex-col justify-center bg-emerald-50/60 -mx-4 px-4 sm:-mx-5 sm:px-5">
            <p className="text-sm font-bold text-emerald-700">{String(index).padStart(2, "0")}</p>
            <p className="mt-1 text-base font-semibold leading-snug tracking-tight text-slate-950 sm:text-lg">{slide.title}</p>
            {slide.subtitle && <p className="mt-1 text-xs leading-5 text-slate-600">{slide.subtitle}</p>}
          </div>
        )}
        {slide.layout === "content" && (
          <div className="flex h-full flex-col">
            <p className="shrink-0 text-sm font-semibold tracking-tight text-slate-950 sm:text-base">{slide.title}</p>
            <span className="mt-1 mb-2 block h-0.5 w-6 rounded-full bg-emerald-700" />
            <ul className="min-h-0 flex-1 space-y-1 overflow-hidden">
              {(slide.bullets ?? []).map((bullet, i) => (
                <li className="flex gap-1.5 text-xs leading-5 text-slate-700 sm:text-[13px]" key={i}>
                  <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-emerald-600" />
                  <span className="min-w-0">{bullet}</span>
                </li>
              ))}
            </ul>
            {slide.body && <p className="mt-1 text-xs leading-5 text-slate-700">{slide.body}</p>}
          </div>
        )}
        {slide.layout === "closing" && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">{slide.title}</p>
            {slide.body && <p className="mt-1.5 text-xs leading-5 text-slate-600">{slide.body}</p>}
            <span className="mt-2 block h-1 w-8 rounded-full bg-emerald-700" />
          </div>
        )}
      </div>
    </div>
  );
}

export function AiPptWorkbench() {
  const [input, setInput] = useState("");
  const [slideCount, setSlideCount] = useState<number>(PPT_LIMITS.defaultSlideCount);
  const [audience, setAudience] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [meta, setMeta] = useState<DeckMeta>();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [message, setMessage] = useState("输入主题或粘贴大纲，点击生成；AI 逐页撰写，右侧实时预览，满意后下载 PPTX。\n");
  const [isExporting, setIsExporting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isStreaming = phase === "streaming";
  const remainingChars = useMemo(() => PPT_LIMITS.maxInputChars - input.length, [input.length]);

  async function generate() {
    const trimmed = input.trim();
    if (!trimmed) {
      setMessage("请先输入 PPT 主题，或粘贴大纲 / 会议纪要等素材。\n");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("streaming");
    setMeta(undefined);
    setSlides([]);
    setMessage(`AI 正在撰写，目标 ${slideCount} 页左右，请稍候…\n`);

    let count = 0;
    try {
      const response = await fetch("/api/tools/ai-ppt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, slideCount, audience: audience.trim() || undefined }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(`${data?.error ?? "生成失败，请稍后重试。"}\n`);
        setPhase("idle");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      const handleEvent = (event: GenerateEvent) => {
        if (event.type === "meta") {
          setMeta({ title: event.title, subtitle: event.subtitle });
        } else if (event.type === "slide") {
          count += 1;
          setSlides((previous) => [...previous, event.slide]);
          setMessage(`已生成 ${count} 页…\n`);
        } else if (event.type === "done") {
          finished = true;
          setPhase("done");
          setMessage(`生成完成，共 ${event.total} 页。预览确认后即可下载；也可以点击重新生成再要一版。\n`);
        } else {
          finished = true;
          setPhase(count > 0 ? "done" : "idle");
          setMessage(`${event.message}${count > 0 ? `（已生成 ${count} 页可直接下载）` : ""}\n`);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          newlineIndex = buffer.indexOf("\n");
          if (!line) continue;
          try {
            handleEvent(JSON.parse(line) as GenerateEvent);
          } catch {
            // 跳过不完整的行
          }
        }
      }

      if (!finished) {
        setPhase(count > 0 ? "done" : "idle");
        setMessage(count > 0 ? `连接提前结束，已生成 ${count} 页，可直接下载。\n` : "生成中断，请稍后重试。\n");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setPhase(count > 0 ? "done" : "idle");
        setMessage(count > 0 ? `已取消；已生成的 ${count} 页仍可下载。\n` : "已取消本次生成。\n");
      } else {
        setPhase(count > 0 ? "done" : "idle");
        setMessage(count > 0 ? `连接异常，已生成 ${count} 页，可直接下载。\n` : "生成失败，请检查网络后重试。\n");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  async function download() {
    if (!meta && slides.length === 0) return;
    setIsExporting(true);
    setMessage("正在打包 PPTX 文件…\n");
    try {
      const response = await fetch("/api/tools/ai-ppt/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: meta?.title, subtitle: meta?.subtitle, slides }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(`${data?.error ?? "导出失败，请重试。"}\n`);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(meta?.title || "AI 演示文稿").replace(/[\\/:*?"<>|]/g, "").slice(0, 60) || "AI 演示文稿"}.pptx`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("PPTX 已开始下载，可在 PowerPoint / WPS / Keynote 中继续编辑。\n");
    } catch {
      setMessage("导出失败，请重试。\n");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleFile(file: File) {
    const text = await file.text();
    if (!text.trim()) {
      setMessage("文件是空的，请换一个文件或直接粘贴内容。\n");
      return;
    }
    setInput(text.trim().slice(0, PPT_LIMITS.maxInputChars));
    setMessage(`已导入「${file.name}」，可继续编辑后再生成。\n`);
  }

  return (
    <section aria-label="AI PPT 生成工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fef7d6] text-amber-800">
            <Presentation aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">AI 云端生成 · DeepSeek 驱动</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">AI PPT 生成器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">生成后可下载编辑</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-900" htmlFor="ai-ppt-input">
                主题 / 大纲 / 素材
              </label>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <FileText aria-hidden="true" className="size-3.5" />
                导入 .txt / .md
              </button>
              <input
                accept=".txt,.md,.markdown"
                aria-label="导入文本文件"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.target.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />
            </div>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              id="ai-ppt-input"
              onChange={(event) => setInput(event.target.value.slice(0, PPT_LIMITS.maxInputChars))}
              placeholder={"例如：向管理层汇报第三季度销售复盘，包含业绩亮点、问题分析与下季度计划\n也可以直接粘贴会议纪要、文章或大纲，AI 会据此组织内容"}
              rows={8}
              value={input}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {remainingChars < 0 ? "内容过长，将被截断" : `还可输入 ${remainingChars} 字`}
            </p>
          </div>

          <div>
            <span className="block text-sm font-semibold text-slate-900">目标页数</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLIDE_COUNT_OPTIONS.map((count) => (
                <button
                  aria-pressed={slideCount === count}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                    slideCount === count
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                  }`}
                  disabled={isStreaming}
                  key={count}
                  onClick={() => setSlideCount(count)}
                  type="button"
                >
                  {count} 页
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="ai-ppt-audience">
              场合与受众（可选）
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              id="ai-ppt-audience"
              onChange={(event) => setAudience(event.target.value)}
              placeholder="例如：部门季度会 · 管理层；客户提案；新员工培训"
              type="text"
              value={audience}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isStreaming}
              onClick={() => void generate()}
              type="button"
            >
              {isStreaming ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
              {isStreaming ? "生成中" : phase === "done" ? "重新生成" : "生成 PPT"}
            </button>
            {isStreaming && (
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                onClick={cancel}
                type="button"
              >
                <SquareX aria-hidden="true" className="size-4" />
                取消
              </button>
            )}
            {phase === "done" && slides.length > 0 && (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isExporting}
                onClick={() => void download()}
                type="button"
              >
                {isExporting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
                {isExporting ? "打包中" : "下载 PPTX"}
              </button>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500">内容由 AI 生成，数据和结论请自行核实；每天最多生成 20 次。</p>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">实时预览</p>
            {phase === "done" && slides.length > 0 && (
              <button
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                disabled={isStreaming}
                onClick={() => void generate()}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="size-3.5" />
                换一版
              </button>
            )}
          </div>
          <div className="mt-2 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
            {meta && (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <span className="font-semibold text-slate-950">{meta.title}</span>
                {meta.subtitle && <span className="mt-0.5 block text-xs text-slate-500">{meta.subtitle}</span>}
              </p>
            )}
            {!meta && slides.length === 0 && !isStreaming && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center">
                <div>
                  <Presentation aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">还没有内容</p>
                  <p className="mt-1 text-xs text-slate-400">输入主题并点击「生成 PPT」，幻灯片会出现在这里</p>
                </div>
              </div>
            )}
            {slides.map((slide, index) => (
              <MiniSlide index={index + 2} key={`${slide.title}-${index}`} slide={slide} />
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
