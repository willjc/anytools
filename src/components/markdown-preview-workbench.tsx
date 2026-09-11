"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Download, Eraser, FileCode2 } from "lucide-react";

import { formatFileSize, triggerDownload } from "@/lib/file-utils";
import { renderMarkdownToHtml } from "@/lib/markdown-preview";

const DOWNLOAD_FILE_NAME = "document.md";

export function MarkdownPreviewWorkbench() {
  const [markdown, setMarkdown] = useState("");
  const [message, setMessage] = useState(
    "在左侧粘贴 Markdown，右侧实时显示排版效果；内容只在当前浏览器中处理。",
  );
  const [hasError, setHasError] = useState(false);
  const deferredMarkdown = useDeferredValue(markdown);
  const html = useMemo(() => renderMarkdownToHtml(deferredMarkdown), [deferredMarkdown]);

  function updateMarkdown(value: string) {
    setMarkdown(value);
    if (hasError) {
      setMessage("已更新内容，右侧预览会同步刷新。");
      setHasError(false);
    }
  }

  function downloadMarkdown() {
    if (!markdown.trim()) {
      setMessage("请先粘贴或输入 Markdown 内容。");
      setHasError(true);
      return;
    }

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    triggerDownload(blob, DOWNLOAD_FILE_NAME);
    setMessage(`已生成 ${DOWNLOAD_FILE_NAME}（${formatFileSize(blob.size)}），下载应已开始。`);
    setHasError(false);
  }

  function clearMarkdown() {
    setMarkdown("");
    setMessage("已清空输入，可以粘贴新的 Markdown。");
    setHasError(false);
  }

  return (
    <section
      aria-label="Markdown 预览工作区"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8"
    >
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <FileCode2 aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Markdown 预览</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          不上传 · 不保存
        </span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-900" htmlFor="markdown-preview-input">
            Markdown 源码
          </label>
          <textarea
            className="mt-3 min-h-80 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            id="markdown-preview-input"
            onChange={(event) => updateMarkdown(event.target.value)}
            placeholder={"# 标题\n\n粘贴 Markdown 内容，右侧会实时渲染…"}
            spellCheck={false}
            value={markdown}
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            支持 GFM 表格、任务列表与代码块；内嵌 HTML 会作为文字显示，不参与渲染。
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">渲染预览</p>
            <span className="text-xs tabular-nums text-slate-500">{markdown.length} 字符</span>
          </div>
          <div className="mt-3 min-h-80 max-h-[36rem] overflow-y-auto rounded-xl border border-slate-200 bg-white px-4 py-3">
            {html ? (
              <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <div className="grid min-h-72 place-items-center px-6 text-center">
                <div>
                  <FileCode2 aria-hidden="true" className="mx-auto size-6 text-slate-400" />
                  <p className="mt-3 text-sm text-slate-500">还没有内容</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    在左侧粘贴 Markdown，这里会即时显示标题、列表、表格与代码块的排版效果。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!markdown}
          onClick={clearMarkdown}
          type="button"
        >
          <Eraser aria-hidden="true" className="size-4" />
          清空
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!markdown.trim()}
          onClick={downloadMarkdown}
          type="button"
        >
          <Download aria-hidden="true" className="size-4" />
          下载 .md
        </button>
      </div>

      <p
        aria-live="polite"
        className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${hasError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}
      >
        {message}
      </p>
    </section>
  );
}
