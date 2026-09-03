"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Copy, Download, FileText, RotateCcw } from "lucide-react";

import { triggerDownload } from "@/lib/file-utils";
import {
  deduplicateLines,
  getTextStats,
  removeBlankLines,
  sortLines,
  trimLineEdges,
} from "@/lib/text-cleaner";

const cleanupActions = [
  { label: "去每行首尾空格", run: trimLineEdges },
  { label: "删除空行", run: removeBlankLines },
  { label: "行去重", run: deduplicateLines },
  { label: "行排序", run: sortLines },
] as const;

export function TextCleanerWorkbench() {
  const [text, setText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [message, setMessage] = useState("粘贴或输入文本，统计与整理都在当前浏览器中完成。\n");
  const [hasError, setHasError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const deferredText = useDeferredValue(text);
  const stats = useMemo(() => getTextStats(deferredText), [deferredText]);

  function showMessage(value: string, error = false) {
    setMessage(value);
    setHasError(error);
  }

  function updateText(value: string) {
    setText(value);
    if (!isModified) setOriginalText(value);
    if (hasError) setMessage("已输入文本，可开始整理。");
    setHasError(false);
  }

  function clean(label: string, run: (value: string) => string) {
    if (!text) {
      showMessage("请先输入或粘贴需要整理的文本。\n", true);
      return;
    }
    const next = run(text);
    if (next === text) {
      showMessage(`“${label}”没有发现需要修改的内容。`);
      return;
    }
    if (!isModified) setOriginalText(text);
    setText(next);
    setIsModified(true);
    showMessage(`已完成“${label}”，需要时可恢复原文。`);
  }

  async function copyText() {
    if (!text) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(text);
      showMessage("文本已复制到剪贴板。");
    } catch {
      textareaRef.current?.focus();
      textareaRef.current?.select();
      showMessage("浏览器无法自动复制，已选中文本，请使用系统复制命令。\n", true);
    }
  }

  function downloadText() {
    if (!text) return;
    triggerDownload(new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }), "cleaned-text.txt");
    showMessage("TXT 文件已生成，下载应已开始。");
  }

  function restoreOriginal() {
    setText(originalText);
    setIsModified(false);
    showMessage("已恢复到本轮整理前的原文。");
  }

  const statItems = [
    ["字符数", stats.characters],
    ["非空格字符", stats.nonWhitespaceCharacters],
    ["行数", stats.lines],
    ["中文词数", stats.chineseWords],
    ["英文词数", stats.englishWords],
  ] as const;

  return (
    <section aria-label="文本整理工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FileText aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">文本整理与字数统计</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">不上传 · 不保存</span>
      </div>

      <div className="mt-7 grid grid-cols-2 border-y border-slate-200 sm:grid-cols-5">
        {statItems.map(([label, value], index) => (
          <div className={`px-3 py-4 text-center ${index % 2 ? "border-l border-slate-200" : ""} ${index > 1 ? "border-t border-slate-200 sm:border-t-0" : ""} sm:border-l sm:first:border-l-0`} key={label}>
            <p className="text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <label className="mt-6 block text-sm font-semibold text-slate-900" htmlFor="text-cleaner-input">待整理文本</label>
      <textarea
        className="mt-3 min-h-80 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        id="text-cleaner-input"
        onChange={(event) => updateText(event.target.value)}
        placeholder="在这里粘贴或输入大段文本…"
        ref={textareaRef}
        spellCheck={false}
        value={text}
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">字符数包含空格和换行；浏览器支持时使用中文分词，否则按汉字统计；英文词数按拉丁字母单词统计。</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {cleanupActions.map(({ label, run }) => (
          <button className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700" key={label} onClick={() => clean(label, run)} type="button">{label}</button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={!text} onClick={() => void copyText()} type="button"><Copy aria-hidden="true" className="size-4" />复制文本</button>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={!isModified} onClick={restoreOriginal} type="button"><RotateCcw aria-hidden="true" className="size-4" />恢复原文</button>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!text} onClick={downloadText} type="button"><Download aria-hidden="true" className="size-4" />下载 TXT</button>
      </div>

      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${hasError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
