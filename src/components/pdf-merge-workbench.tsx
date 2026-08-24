"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Combine, Download, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";

import { formatFileSize, triggerDownload } from "@/lib/file-utils";
import { mergePdfBytes } from "@/lib/pdf-merge";

type QueuedFile = {
  id: string;
  file: File;
  pageCount: number;
};

export function PdfMergeWorkbench() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择两个或多个 PDF，调整顺序后合并。\n");

  async function addFiles(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const queued: QueuedFile[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setMessage(`已跳过 ${file.name}：不是 PDF 文件。\n`);
        continue;
      }
      try {
        const pageCount = (await PDFDocument.load(await file.arrayBuffer())).getPageCount();
        queued.push({ id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`, file, pageCount });
      } catch {
        setMessage(`无法读取 ${file.name}，可能已损坏或加密。\n`);
      }
    }
    if (queued.length > 0) {
      setFiles((current) => [...current, ...queued]);
      setMessage(`已加入 ${queued.length} 个文件，可继续添加或调整顺序。`);
    }
  }

  function move(id: string, offset: number) {
    setFiles((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function merge() {
    if (files.length < 2) {
      setMessage("请至少选择两个 PDF 再合并。\n");
      return;
    }

    setIsProcessing(true);
    setMessage("正在浏览器本地合并…");
    try {
      const bytesList: ArrayBuffer[] = [];
      for (const item of files) {
        bytesList.push(await item.file.arrayBuffer());
      }
      const mergedBytes = await mergePdfBytes(bytesList);
      triggerDownload(new Blob([Uint8Array.from(mergedBytes)], { type: "application/pdf" }), "merged.pdf");
      setMessage(`已合并 ${files.length} 个文件为一个 PDF，下载应已开始。`);
    } catch {
      setMessage("合并失败，请确认所有文件都是未加密的标准 PDF。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 合并工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Combine aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">合并 PDF</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{files.length} 个文件</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          <Plus aria-hidden="true" className="size-4" /> 添加 PDF 文件
          <input accept=".pdf,application/pdf" className="sr-only" multiple type="file" onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        </label>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((item, index) => (
              <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3" key={item.id}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{item.file.name}</span>
                <span className="hidden shrink-0 text-xs text-slate-500 sm:block">{item.pageCount} 页 · {formatFileSize(item.file.size)}</span>
                <button aria-label="上移" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" disabled={index === 0} onClick={() => move(item.id, -1)} type="button"><ArrowUp aria-hidden="true" className="size-4" /></button>
                <button aria-label="下移" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" disabled={index === files.length - 1} onClick={() => move(item.id, 1)} type="button"><ArrowDown aria-hidden="true" className="size-4" /></button>
                <button aria-label="移除" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600" onClick={() => setFiles((current) => current.filter((entry) => entry.id !== item.id))} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isProcessing || files.length < 2} onClick={() => void merge()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在合并" : "合并并下载"}
        </button>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
