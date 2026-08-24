"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, LoaderCircle, PenLine, Trash2 } from "lucide-react";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { coverAndWriteText, type TextPatch } from "@/lib/pdf-edit-text";
import { renderPdfPageToCanvas } from "@/lib/pdf-render";

type Selection = { left: number; top: number; width: number; height: number };

type PendingPatch = {
  id: string;
  pageNumber: number;
  selection: Selection;
  patch: TextPatch;
};

async function renderReplacementToPng(value: string, boxWidthPx: number, boxHeightPx: number): Promise<{ bytes: Uint8Array; drawWidthPt: number; drawHeightPt: number }> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法创建文字画布。");
  }

  let fontSize = Math.max(8, Math.floor(boxHeightPx));
  context.font = `${fontSize}px sans-serif`;
  while (fontSize > 8 && context.measureText(value).width > boxWidthPx) {
    fontSize -= 1;
    context.font = `${fontSize}px sans-serif`;
  }

  canvas.width = Math.max(1, Math.ceil(context.measureText(value).width) + 2);
  canvas.height = Math.max(1, fontSize + 4);
  context.font = `${fontSize}px sans-serif`;
  context.textBaseline = "middle";
  context.fillStyle = "#111111";
  context.fillText(value, 1, canvas.height / 2);

  const dataUrl = canvas.toDataURL("image/png");
  const response = await fetch(dataUrl);
  return { bytes: new Uint8Array(await response.arrayBuffer()), drawWidthPt: 0, drawHeightPt: 0 };
}

export function PdfEditTextWorkbench() {
  const [file, setFile] = useState<File>();
  const [sourceBytes, setSourceBytes] = useState<ArrayBuffer>();
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [replacement, setReplacement] = useState("");
  const [patches, setPatches] = useState<PendingPatch[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>();
  const [selection, setSelection] = useState<Selection>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [pageSizePt, setPageSizePt] = useState<{ width: number; height: number }>();
  const [message, setMessage] = useState("选择 PDF，框选要修改的文字，再输入新内容。\n");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function loadPage(bytes: ArrayBuffer, targetPage: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);
    try {
      await renderPdfPageToCanvas(bytes, targetPage, canvas);
      const { PDFDocument } = await import("pdf-lib");
      const document = await PDFDocument.load(bytes.slice(0));
      const { width, height } = document.getPage(targetPage - 1).getSize();
      setPageSizePt({ width, height });
      setSelection(undefined);
      setDragStart(undefined);
    } finally {
      setIsRendering(false);
    }
  }

  async function selectPdf(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setMessage("请选择 PDF 文件。\n");
      return;
    }

    try {
      const bytes = await selectedFile.arrayBuffer();
      const count = await (async () => {
        const { PDFDocument } = await import("pdf-lib");
        return (await PDFDocument.load(bytes.slice(0))).getPageCount();
      })();
      setFile(selectedFile);
      setSourceBytes(bytes);
      setPageCount(count);
      setPatches([]);
      setMessage(`已读取 ${count} 页，正在渲染第 1 页…`);
      await loadPage(bytes, 1);
      setPageNumber(1);
      setMessage("拖动鼠标框选要遮盖的文字。");
    } catch {
      setFile(undefined);
      setSourceBytes(undefined);
      setPageCount(0);
      setMessage("无法读取此 PDF，可能已损坏或加密。\n");
    }
  }

  async function goToPage(target: number) {
    if (!sourceBytes || target < 1 || target > pageCount || target === pageNumber) return;
    setPageNumber(target);
    await loadPage(sourceBytes, target);
  }

  function relativePoint(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(Math.max(0, event.clientX - rect.left), rect.width),
      y: Math.min(Math.max(0, event.clientY - rect.top), rect.height),
      rectWidth: rect.width,
      rectHeight: rect.height,
    };
  }

  function onMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const point = relativePoint(event);
    setDragStart({ x: point.x, y: point.y });
    setSelection({ left: point.x, top: point.y, width: 0, height: 0 });
  }

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!dragStart) return;
    const point = relativePoint(event);
    setSelection({
      left: Math.min(dragStart.x, point.x),
      top: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    });
  }

  function commitSelection() {
    if (!selection || !pageSizePt || selection.width < 4 || selection.height < 4) {
      setSelection(undefined);
      setDragStart(undefined);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // The selection is tracked in CSS pixels of the displayed canvas, so
    // convert with the on-screen size — canvas.width is the render resolution
    // and can be much larger than what is shown.
    const displayedWidth = canvas.clientWidth || canvas.width;
    const displayedHeight = canvas.clientHeight || canvas.height;
    const scalePtPerPx = pageSizePt.width / displayedWidth;
    const scalePtPerPxY = pageSizePt.height / displayedHeight;
    const patchX = selection.left * scalePtPerPx;
    const patchWidth = selection.width * scalePtPerPx;
    const patchHeight = selection.height * scalePtPerPxY;
    const patchY = pageSizePt.height - (selection.top + selection.height) * scalePtPerPxY;

    const id = `patch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPatches((current) => [
      ...current,
      {
        id,
        pageNumber,
        selection,
        patch: {
          pageNumber: pageNumber - 1,
          x: patchX,
          y: patchY,
          width: patchWidth,
          height: patchHeight,
          fontSize: Math.max(6, patchHeight * 0.72),
          content: { kind: "text", value: replacement.trim() || " " },
        },
      },
    ]);
    setSelection(undefined);
    setDragStart(undefined);
    setMessage("已记录一处修改，可继续框选或导出。");
  }

  async function applyReplacement(id: string) {
    if (!replacement.trim()) {
      setMessage("请先输入替换后的文字。\n");
      return;
    }

    const rendered = await renderReplacementToPng(replacement.trim(), 200, 20);
    setPatches((current) =>
      current.map((entry) =>
        entry.id === id
          ? { ...entry, patch: { ...entry.patch, content: { kind: "png", bytes: rendered.bytes, drawWidthPt: entry.patch.width, drawHeightPt: entry.patch.height } } }
          : entry,
      ),
    );
  }

  async function exportPdf() {
    if (!file || !sourceBytes || patches.length === 0) return;
    if (patches.some((entry) => entry.patch.content.kind === "text")) {
      setMessage("请先为每处修改填写替换文字。\n");
      return;
    }

    setIsProcessing(true);
    setMessage("正在浏览器本地生成新 PDF…");
    try {
      const bytes = await coverAndWriteText(sourceBytes, patches.map((entry) => entry.patch));
      triggerDownload(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }), getDownloadFileName(file.name, "-edited", "pdf"));
      setMessage("修改完成，下载应已开始。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 改字工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><PenLine aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 改字</h2>
          </div>
        </div>
        {pageCount > 0 && (
          <div className="flex items-center gap-2">
            <button aria-label="上一页" className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-30" disabled={pageNumber <= 1 || isRendering} onClick={() => void goToPage(pageNumber - 1)} type="button"><ChevronLeft className="size-4" /></button>
            <span className="text-sm font-medium text-slate-700">{pageNumber} / {pageCount}</span>
            <button aria-label="下一页" className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-30" disabled={pageNumber >= pageCount || isRendering} onClick={() => void goToPage(pageNumber + 1)} type="button"><ChevronRight className="size-4" /></button>
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.62fr]">
        <div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            选择 PDF 文件
            <input accept=".pdf,application/pdf" className="sr-only" type="file" onChange={(event) => { void selectPdf(event.target.files?.[0]); event.target.value = ""; }} />
          </label>

          <div ref={wrapRef} className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={commitSelection} onMouseLeave={() => dragStart && commitSelection()}>
            <canvas className="block h-auto w-full select-none" ref={canvasRef} />
            {isRendering && <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm text-slate-500">正在渲染页面…</div>}
            {patches.filter((entry) => entry.pageNumber === pageNumber).map((entry) => (
              <div className="pointer-events-none absolute border-2 border-emerald-500/70 bg-emerald-200/30" key={entry.id} style={{ left: entry.selection.left, top: entry.selection.top, width: entry.selection.width, height: entry.selection.height }} />
            ))}
            {selection && (
              <div className="pointer-events-none absolute border-2 border-emerald-600 bg-emerald-200/30" style={{ left: selection.left, top: selection.top, width: selection.width, height: selection.height }} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-900" htmlFor="edit-replacement">替换后的文字</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="edit-replacement" onChange={(event) => setReplacement(event.target.value)} placeholder="输入用来遮盖原文的新文字" type="text" value={replacement} />
          <p className="text-xs leading-5 text-slate-500">框选后会用白色遮盖原区域并写入上面的文字；支持中文。适合改正错别字、金额、日期等简单场景。</p>

          <ul className="space-y-2">
            {patches.map((entry, index) => (
              <li className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700" key={entry.id}>
                <span className="min-w-0 flex-1 truncate">修改 {index + 1} · 第 {entry.pageNumber} 页</span>
                {entry.patch.content.kind === "text" && (
                  <button className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100" onClick={() => void applyReplacement(entry.id)} type="button">写入文字</button>
                )}
                <button aria-label="删除修改" className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600" onClick={() => setPatches((current) => current.filter((item) => item.id !== entry.id))} type="button"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || patches.length === 0 || isProcessing} onClick={() => void exportPdf()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在处理" : "导出修改后的 PDF"}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
