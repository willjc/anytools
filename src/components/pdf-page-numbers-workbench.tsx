"use client";

import { useState } from "react";
import { Download, Hash, LoaderCircle } from "lucide-react";
import { PDFDocument } from "pdf-lib";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { numberPdfBytes, type PageNumberPosition } from "@/lib/pdf-page-numbers";

const POSITIONS: { value: PageNumberPosition; label: string }[] = [
  { value: "bottom-center", label: "底部居中" },
  { value: "bottom-right", label: "底部右侧" },
  { value: "bottom-left", label: "底部左侧" },
  { value: "top-center", label: "顶部居中" },
  { value: "top-right", label: "顶部右侧" },
  { value: "top-left", label: "顶部左侧" },
];

export function PdfPageNumbersWorkbench() {
  const [file, setFile] = useState<File>();
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [template, setTemplate] = useState("{n} / {total}");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择 PDF 后设置页码样式。\n");

  async function selectPdf(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setMessage("请选择 PDF 文件。\n");
      return;
    }
    try {
      const pageCount = (await PDFDocument.load(await selectedFile.arrayBuffer())).getPageCount();
      setFile(selectedFile);
      setPageCount(pageCount);
      setMessage(`已读取 ${pageCount} 页。`);
    } catch {
      setFile(undefined);
      setPageCount(0);
      setMessage("无法读取此 PDF，可能已损坏或加密。\n");
    }
  }

  async function applyNumbers() {
    if (!file) return;

    setIsProcessing(true);
    setMessage("正在浏览器本地插入页码…");
    try {
      const bytes = await numberPdfBytes(await file.arrayBuffer(), { position, startAt, template });
      triggerDownload(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }), getDownloadFileName(file.name, "-paged", "pdf"));
      setMessage("页码已添加完成，下载应已开始。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "添加页码失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 加页码工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Hash aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 加页码</h2>
          </div>
        </div>
        {pageCount > 0 && <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">共 {pageCount} 页</span>}
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择 PDF 文件
          <input accept=".pdf,application/pdf" className="sr-only" type="file" onChange={(event) => { void selectPdf(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-900">
            页码位置
            <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setPosition(event.target.value as PageNumberPosition)} value={position}>
              {POSITIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            起始编号
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" min="0" onChange={(event) => setStartAt(Number(event.target.value) || 0)} type="number" value={startAt} />
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            页码格式
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setTemplate(event.target.value)} placeholder="{n} / {total}" type="text" value={template} />
          </label>
        </div>
        <p className="text-xs leading-5 text-slate-500">格式中的 {"{n}"} 会替换为当前页码，{"{total}"} 替换为最后一页编号；暂不支持中文与全角字符。</p>

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void applyNumbers()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在处理" : "添加页码并下载"}
        </button>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
