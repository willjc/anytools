"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileImage, FileText, LoaderCircle } from "lucide-react";

import { PDF_TO_IMAGE_MAX_PAGES } from "@/lib/browser-pdf-tools";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { parsePageSelection } from "@/lib/pdf-pages";
import { renderPdfPages } from "@/lib/pdf-render";

type OutputFormat = "png" | "jpg";
type Clarity = "standard" | "high";

type LoadedPdf = {
  file: File;
  bytes: ArrayBuffer;
  pageCount: number;
};

type RenderedPage = {
  pageNumber: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  fileName: string;
};

const MAX_PDF_BYTES = 50 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const type = format === "png" ? "image/png" : "image/jpeg";
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("无法生成图片"))), type, format === "jpg" ? 0.9 : undefined);
  });
}

export function PdfToImageWorkbench() {
  const [pdf, setPdf] = useState<LoadedPdf>();
  const [selection, setSelection] = useState("");
  const [format, setFormat] = useState<OutputFormat>("png");
  const [clarity, setClarity] = useState<Clarity>("high");
  const [results, setResults] = useState<RenderedPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("选择 PDF，再设置格式、清晰度和页码范围。");
  const [isError, setIsError] = useState(false);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => () => {
    results.forEach((result) => URL.revokeObjectURL(result.url));
  }, [results]);

  async function selectPdf(file: File | undefined) {
    if (!file || loadingRef.current) return;
    setResults([]);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdf(undefined);
      setIsError(true);
      setMessage("请选择 PDF 文件。");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setPdf(undefined);
      setIsError(true);
      setMessage("PDF 文件不能超过 50 MB。");
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    try {
      const bytes = await file.arrayBuffer();
      const { PDFDocument } = await import("pdf-lib");
      const pageCount = (await PDFDocument.load(bytes.slice(0))).getPageCount();
      if (!mountedRef.current) return;
      const defaultEnd = Math.min(pageCount, PDF_TO_IMAGE_MAX_PAGES);
      setPdf({ file, bytes, pageCount });
      setSelection(defaultEnd === 1 ? "1" : `1-${defaultEnd}`);
      setIsError(false);
      setMessage(pageCount > PDF_TO_IMAGE_MAX_PAGES ? `已读取 ${pageCount} 页。为控制浏览器内存，默认选择前 ${PDF_TO_IMAGE_MAX_PAGES} 页。` : `已读取 ${pageCount} 页。`);
    } catch {
      if (!mountedRef.current) return;
      setPdf(undefined);
      setSelection("");
      setIsError(true);
      setMessage("无法读取此 PDF，可能已损坏或加密。");
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  }

  function resetResults() {
    if (results.length) setResults([]);
  }

  async function convert() {
    if (!pdf) return;
    const parsed = parsePageSelection(selection, pdf.pageCount);
    if ("error" in parsed) {
      setIsError(true);
      setMessage(parsed.error);
      return;
    }
    if (parsed.pages.length > PDF_TO_IMAGE_MAX_PAGES) {
      setIsError(true);
      setMessage(`一次最多转换 ${PDF_TO_IMAGE_MAX_PAGES} 页，请缩小页码范围。`);
      return;
    }

    setIsProcessing(true);
    setIsError(false);
    setResults([]);
    const rendered: RenderedPage[] = [];
    try {
      const maxDimension = clarity === "high" ? 1400 : 1000;
      const digits = String(pdf.pageCount).length;
      await renderPdfPages(pdf.bytes, parsed.pages, maxDimension, async (output, pageNumber, index) => {
        if (!mountedRef.current) throw new Error("conversion-cancelled");
        setMessage(`正在生成第 ${index + 1} / ${parsed.pages.length} 张图片…`);
        const blob = await canvasToBlob(output, format);
        if (!mountedRef.current) throw new Error("conversion-cancelled");
        const fileName = getDownloadFileName(pdf.file.name, `-page-${String(pageNumber).padStart(digits, "0")}`, format);
        rendered.push({ pageNumber, blob, url: URL.createObjectURL(blob), width: output.width, height: output.height, fileName });
      });

      if (!mountedRef.current) {
        rendered.forEach((result) => URL.revokeObjectURL(result.url));
        return;
      }
      setResults(rendered);
      setMessage(`已生成 ${rendered.length} 张 ${format.toUpperCase()} 图片，可逐张或一键下载。`);
    } catch {
      rendered.forEach((result) => URL.revokeObjectURL(result.url));
      if (!mountedRef.current) return;
      setIsError(true);
      setMessage("转换失败。请确认 PDF 未加密，或减少转换页数后重试。");
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }

  function downloadAll() {
    results.forEach((result, index) => {
      window.setTimeout(() => triggerDownload(result.blob, result.fileName), index * 250);
    });
    setIsError(false);
    setMessage("正在逐张下载；若浏览器询问，请允许下载多个文件。");
  }

  return (
    <section aria-label="PDF 转图片工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FileImage aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 转图片</h2>
          </div>
        </div>
        {results.length ? (
          <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800" onClick={downloadAll} type="button"><Download aria-hidden="true" className="size-4" />一键下载全部</button>
        ) : (
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">PNG · JPG</span>
        )}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <label className="group grid min-h-48 cursor-pointer place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
          <input accept="application/pdf,.pdf" className="sr-only" disabled={isLoading || isProcessing} onChange={(event) => { void selectPdf(event.target.files?.[0]); event.target.value = ""; }} type="file" />
          <FileText aria-hidden="true" className="size-9 text-emerald-700" />
          <span className="mt-3 text-sm font-semibold text-slate-900">选择 PDF 文件</span>
          <span className="mt-1 text-xs leading-5 text-slate-500">文件只在当前浏览器中处理 · 最大 50 MB</span>
          {pdf ? <span className="mt-4 max-w-full truncate rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700">{pdf.file.name} · {pdf.pageCount} 页 · {formatFileSize(pdf.file.size)}</span> : null}
        </label>

        <div className="rounded-3xl bg-slate-50 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-900">
              图片格式
              <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isProcessing} onChange={(event) => { setFormat(event.target.value as OutputFormat); resetResults(); }} value={format}>
                <option value="png">PNG（无损）</option>
                <option value="jpg">JPG（较小）</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-900">
              清晰度
              <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isProcessing} onChange={(event) => { setClarity(event.target.value as Clarity); resetResults(); }} value={clarity}>
                <option value="standard">标准（最长边约 1000px）</option>
                <option value="high">高清（最长边约 1400px）</option>
              </select>
            </label>
          </div>
          <label className="mt-5 block text-sm font-semibold text-slate-900" htmlFor="pdf-image-pages">页码范围</label>
          <input aria-describedby="pdf-image-pages-help" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100" disabled={!pdf || isProcessing} id="pdf-image-pages" onChange={(event) => { setSelection(event.target.value); resetResults(); }} placeholder="例如 1-3, 5" value={selection} />
          <p className="mt-2 text-xs leading-5 text-slate-500" id="pdf-image-pages-help">逗号分隔页码或范围，一次最多 {PDF_TO_IMAGE_MAX_PAGES} 页。{pdf ? ` 当前文件共 ${pdf.pageCount} 页。` : ""}</p>
          <button className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!pdf || isLoading || isProcessing} onClick={() => void convert()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <FileImage aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在转换" : "转换为图片"}
          </button>
        </div>
      </div>

      {results.length ? (
        <ul aria-label="转换结果" className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white" key={result.pageNumber}>
              <div className="flex h-56 items-center justify-center bg-slate-100 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`PDF 第 ${result.pageNumber} 页预览`} className="max-h-full max-w-full object-contain" src={result.url} />
              </div>
              <div className="flex items-center gap-3 p-3">
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-900">第 {result.pageNumber} 页 <span className="block text-xs font-normal text-slate-500">{result.width} × {result.height} · {formatFileSize(result.blob.size)}</span></span>
                <button aria-label={`下载第 ${result.pageNumber} 页`} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700" onClick={() => triggerDownload(result.blob, result.fileName)} type="button"><Download aria-hidden="true" className="size-4" />下载</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
