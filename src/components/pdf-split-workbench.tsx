"use client";

import { useState } from "react";
import { Download, FileText, LoaderCircle, Scissors } from "lucide-react";
import { PDFDocument } from "pdf-lib";

import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { parsePageSelection } from "@/lib/pdf-pages";
import { splitPdfBytes } from "@/lib/pdf-split";

type LoadedPdf = {
  file: File;
  pageCount: number;
};

export function PdfSplitWorkbench() {
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdf>();
  const [selection, setSelection] = useState("");
  const [message, setMessage] = useState("选择一个 PDF 后即可设定要保留的页码。");
  const [isProcessing, setIsProcessing] = useState(false);

  async function selectPdf(file: File | undefined) {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setLoadedPdf(undefined);
      setMessage("请选择 PDF 文件。\n");
      return;
    }

    try {
      const document = await PDFDocument.load(await file.arrayBuffer());
      const pageCount = document.getPageCount();
      setLoadedPdf({ file, pageCount });
      setSelection(`1-${pageCount}`);
      setMessage(`已读取 ${pageCount} 页，可修改下方的页码范围。`);
    } catch {
      setLoadedPdf(undefined);
      setMessage("无法读取此 PDF。它可能已损坏、加密或不是标准 PDF 文件。\n");
    }
  }

  async function splitPdf() {
    if (!loadedPdf) return;

    const parsed = parsePageSelection(selection, loadedPdf.pageCount);
    if ("error" in parsed) {
      setMessage(parsed.error);
      return;
    }

    setIsProcessing(true);
    setMessage("正在浏览器本地生成新的 PDF…");

    try {
      const bytes = await splitPdfBytes(await loadedPdf.file.arrayBuffer(), parsed.pages);
      const downloadBytes = Uint8Array.from(bytes);
      triggerDownload(new Blob([downloadBytes], { type: "application/pdf" }), getDownloadFileName(loadedPdf.file.name, "-split", "pdf"));
      setMessage(`已生成包含 ${parsed.pages.length} 页的新 PDF。下载应已开始。`);
    } catch {
      setMessage("生成失败。请尝试一个未加密且页面较少的 PDF。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 拆分工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Scissors aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">拆分 PDF 页面</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">仅支持 .pdf</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <label className="group grid min-h-48 cursor-pointer place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40">
          <input accept="application/pdf,.pdf" className="sr-only" onChange={(event) => void selectPdf(event.target.files?.[0])} type="file" />
          <FileText aria-hidden="true" className="size-9 text-emerald-700" />
          <span className="mt-3 text-sm font-semibold text-slate-900">选择 PDF 文件</span>
          <span className="mt-1 text-xs leading-5 text-slate-500">文件只在当前浏览器中处理</span>
          {loadedPdf ? <span className="mt-4 max-w-full truncate rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700">{loadedPdf.file.name} · {formatFileSize(loadedPdf.file.size)}</span> : null}
        </label>

        <div className="rounded-3xl bg-slate-50 p-5 sm:p-6">
          <label className="block text-sm font-semibold text-slate-900" htmlFor="page-selection">保留页码</label>
          <input
            aria-describedby="page-selection-help"
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={!loadedPdf || isProcessing}
            id="page-selection"
            onChange={(event) => setSelection(event.target.value)}
            placeholder="例如 1-3, 5"
            value={selection}
          />
          <p className="mt-2 text-xs leading-5 text-slate-500" id="page-selection-help">用逗号分隔页码或范围，例如 1-3, 5。{loadedPdf ? ` 当前文件共 ${loadedPdf.pageCount} 页。` : ""}</p>
          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!loadedPdf || isProcessing}
            onClick={() => void splitPdf()}
            type="button"
          >
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在生成" : "生成并下载 PDF"}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
