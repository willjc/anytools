"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, ListOrdered, LoaderCircle, RotateCw, Trash2 } from "lucide-react";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { organizePdfBytes, type OrganizedPage } from "@/lib/pdf-organize";
import { renderPdfPageToCanvas } from "@/lib/pdf-render";

type PageThumb = {
  index: number;
  rotation: number;
  dataUrl?: string;
};

export function PdfOrganizeWorkbench() {
  const [file, setFile] = useState<File>();
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [sourceBytes, setSourceBytes] = useState<ArrayBuffer>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择 PDF 后即可删除、旋转或重排页面。\n");
  const thumbsRef = useRef<HTMLDivElement>(null);

  async function selectPdf(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setMessage("请选择 PDF 文件。\n");
      return;
    }

    try {
      const bytes = await selectedFile.arrayBuffer();
      const pageCount = await (async () => {
        const { PDFDocument } = await import("pdf-lib");
        return (await PDFDocument.load(bytes.slice(0))).getPageCount();
      })();

      setFile(selectedFile);
      setSourceBytes(bytes);
      setPages(Array.from({ length: pageCount }, (_, index) => ({ index, rotation: 0 })));
      setMessage(`已读取 ${pageCount} 页，正在生成缩略图…`);

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        try {
          const canvas = document.createElement("canvas");
          await renderPdfPageToCanvas(bytes, pageNumber, canvas);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setPages((current) => current.map((page) => (page.index === pageNumber - 1 ? { ...page, dataUrl } : page)));
        } catch {
          // Thumbnails are optional; the page can still be organized without one.
        }
      }
      setMessage("缩略图已生成。点击按钮调整页面。");
    } catch {
      setFile(undefined);
      setPages([]);
      setSourceBytes(undefined);
      setMessage("无法读取此 PDF，可能已损坏或加密。\n");
    }
  }

  function updatePage(index: number, updater: (page: PageThumb) => PageThumb) {
    setPages((current) => current.map((page) => (page.index === index ? updater(page) : page)));
  }

  function move(id: number, offset: number) {
    setPages((current) => {
      const position = current.findIndex((page) => page.index === id);
      const target = position + offset;
      if (position < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[position], next[target]] = [next[target], next[position]];
      return next;
    });
  }

  async function exportOrganized() {
    if (!file || !sourceBytes || pages.length === 0) return;

    const plan: OrganizedPage[] = pages.map((page) => ({ index: page.index, rotation: page.rotation }));
    if (plan.every((entry) => entry.rotation === 0) && plan.every((entry, i) => entry.index === i)) {
      setMessage("页面顺序与方向没有变化，无需导出。\n");
      return;
    }

    setIsProcessing(true);
    setMessage("正在浏览器本地生成新 PDF…");
    try {
      const bytes = await organizePdfBytes(sourceBytes, plan);
      triggerDownload(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }), getDownloadFileName(file.name, "-organized", "pdf"));
      setMessage("整理完成，下载应已开始。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "整理失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 页面整理工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ListOrdered aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 页面整理</h2>
          </div>
        </div>
        {pages.length > 0 && <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{pages.length} 页保留</span>}
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择 PDF 文件
          <input accept=".pdf,application/pdf" className="sr-only" type="file" onChange={(event) => { void selectPdf(event.target.files?.[0]); event.target.value = ""; }} />
        </label>

        {pages.length > 0 && (
          <div ref={thumbsRef}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pages.map((page, position) => (
                <li className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3" key={page.index}>
                  <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {page.dataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img alt={`第 ${page.index + 1} 页`} className="max-h-full max-w-full object-contain" src={page.dataUrl} style={{ transform: `rotate(${page.rotation}deg)` }} />
                    ) : (
                      <span className="text-xs text-slate-500">第 {page.index + 1} 页</span>
                    )}
                  </div>
                  <div className="flex w-full items-center justify-center gap-1">
                    <button aria-label="上移" className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" disabled={position === 0} onClick={() => move(page.index, -1)} type="button"><ArrowUp className="size-3.5" /></button>
                    <button aria-label="下移" className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" disabled={position === pages.length - 1} onClick={() => move(page.index, 1)} type="button"><ArrowDown className="size-3.5" /></button>
                    <button aria-label="旋转 90 度" className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => updatePage(page.index, (entry) => ({ ...entry, rotation: (entry.rotation + 90) % 360 }))} type="button"><RotateCw className="size-3.5" /></button>
                    <button aria-label="删除该页" className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600" onClick={() => setPages((current) => current.filter((entry) => entry.index !== page.index))} type="button"><Trash2 className="size-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || pages.length === 0 || isProcessing} onClick={() => void exportOrganized()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在处理" : "导出整理后的 PDF"}
        </button>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
