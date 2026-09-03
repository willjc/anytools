"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Images, LoaderCircle, Plus, Trash2 } from "lucide-react";

import {
  getImageKind,
  getImageFileLimitError,
  getImageLimitError,
  getImagePdfLayout,
  IMAGE_TO_PDF_LIMITS,
  type ImageKind,
  type ImagePageMode,
} from "@/lib/browser-pdf-tools";
import { formatFileSize, triggerDownload } from "@/lib/file-utils";

type QueuedImage = {
  id: string;
  file: File;
  kind: ImageKind;
  width: number;
  height: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("无法读取图片"));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: "image/jpeg" | "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("无法转换图片"))), type, type === "image/jpeg" ? 0.95 : undefined);
  });
}

async function normalizeForPdf(file: File, kind: ImageKind): Promise<{ bytes: ArrayBuffer; type: "jpeg" | "png" }> {
  if (kind === "png") return { bytes: await file.arrayBuffer(), type: "png" };

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器无法创建图片画布");

  if (kind === "jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0);
  const type = kind === "jpeg" ? "jpeg" : "png";
  const blob = await canvasToBlob(canvas, `image/${type}`);
  const bytes = await blob.arrayBuffer();
  canvas.width = 1;
  canvas.height = 1;
  return { bytes, type };
}

export function ImageToPdfWorkbench() {
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [pageMode, setPageMode] = useState<ImagePageMode>("original");
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择 JPG、PNG 或 WebP 图片，排序后生成一个 PDF。");
  const [isError, setIsError] = useState(false);
  const addingRef = useRef(false);
  const nextIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function addImages(selectedFiles: FileList | null) {
    if (!selectedFiles?.length || addingRef.current) return;
    addingRef.current = true;
    setIsAdding(true);

    const accepted: QueuedImage[] = [];
    const sizes = images.map(({ width, height }) => ({ width, height }));
    let totalBytes = images.reduce((total, image) => total + image.file.size, 0);
    const skipped: string[] = [];

    for (const file of Array.from(selectedFiles)) {
      if (sizes.length >= IMAGE_TO_PDF_LIMITS.maxFiles) {
        skipped.push(`一次最多处理 ${IMAGE_TO_PDF_LIMITS.maxFiles} 张图片。`);
        break;
      }
      const kind = getImageKind(file.type, file.name);
      if (!kind) {
        skipped.push(`${file.name} 不是 JPG、PNG 或 WebP。`);
        continue;
      }
      const fileLimitError = getImageFileLimitError(file.size, totalBytes + file.size);
      if (fileLimitError) {
        skipped.push(`${file.name}：${fileLimitError}`);
        continue;
      }

      try {
        const image = await loadImage(file);
        if (!mountedRef.current) return;
        const size = { width: image.naturalWidth, height: image.naturalHeight };
        const limitError = getImageLimitError([...sizes, size]);
        if (limitError) {
          skipped.push(`${file.name}：${limitError}`);
          continue;
        }
        sizes.push(size);
        totalBytes += file.size;
        nextIdRef.current += 1;
        accepted.push({ id: String(nextIdRef.current), file, kind, ...size });
      } catch {
        skipped.push(`${file.name} 无法读取，可能已损坏。`);
      }
    }

    if (!mountedRef.current) return;
    if (accepted.length) setImages((current) => [...current, ...accepted]);
    setIsError(skipped.length > 0);
    setMessage(
      skipped.length
        ? `${accepted.length ? `已加入 ${accepted.length} 张。` : ""}${skipped.join(" ")}`
        : `已加入 ${accepted.length} 张图片，可继续添加或调整顺序。`,
    );
    addingRef.current = false;
    setIsAdding(false);
  }

  function move(id: string, offset: number) {
    if (addingRef.current || isProcessing) return;
    setImages((current) => {
      const index = current.findIndex((image) => image.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function exportPdf() {
    if (!images.length) return;

    setIsProcessing(true);
    setIsError(false);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();

      for (let index = 0; index < images.length; index += 1) {
        if (!mountedRef.current) return;
        const image = images[index];
        setMessage(`正在处理第 ${index + 1} / ${images.length} 张图片…`);
        const normalized = await normalizeForPdf(image.file, image.kind);
        if (!mountedRef.current) return;
        const embedded = normalized.type === "jpeg" ? await pdf.embedJpg(normalized.bytes) : await pdf.embedPng(normalized.bytes);
        const layout = getImagePdfLayout(image.width, image.height, pageMode);
        const page = pdf.addPage([layout.pageWidth, layout.pageHeight]);
        page.drawImage(embedded, {
          x: layout.drawX,
          y: layout.drawY,
          width: layout.drawWidth,
          height: layout.drawHeight,
        });
      }

      const bytes = await pdf.save();
      if (!mountedRef.current) return;
      triggerDownload(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }), "images.pdf");
      setMessage(`已将 ${images.length} 张图片生成一个 PDF，下载应已开始。`);
    } catch {
      if (!mountedRef.current) return;
      setIsError(true);
      setMessage("生成失败。请减少图片数量或分辨率后重试。");
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }

  return (
    <section aria-label="图片转 PDF 工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Images aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">图片转 PDF</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{images.length} / {IMAGE_TO_PDF_LIMITS.maxFiles} 张</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
            <Plus aria-hidden="true" className="size-4" /> 添加图片
            <input accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" disabled={isAdding || isProcessing} multiple onChange={(event) => { void addImages(event.target.files); event.target.value = ""; }} type="file" />
          </label>
          <p className="text-xs leading-5 text-slate-500">单张不超过 20 MB / 4000 万像素；全部图片合计不超过 100 MB / 1 亿像素。</p>

          {images.length ? (
            <ol className="space-y-2">
              {images.map((image, index) => (
                <li className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2" key={image.id}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{image.file.name}</span>
                    <span className="block text-xs text-slate-500">{image.width} × {image.height} · {formatFileSize(image.file.size)}</span>
                  </span>
                  <button aria-label={`上移 ${image.file.name}`} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" disabled={index === 0 || isAdding || isProcessing} onClick={() => move(image.id, -1)} type="button"><ArrowUp aria-hidden="true" className="size-4" /></button>
                  <button aria-label={`下移 ${image.file.name}`} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" disabled={index === images.length - 1 || isAdding || isProcessing} onClick={() => move(image.id, 1)} type="button"><ArrowDown aria-hidden="true" className="size-4" /></button>
                  <button aria-label={`移除 ${image.file.name}`} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" disabled={isAdding || isProcessing} onClick={() => setImages((current) => current.filter((entry) => entry.id !== image.id))} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">尚未添加图片。</div>
          )}
        </div>

        <div className="h-fit rounded-3xl bg-slate-50 p-5 sm:p-6">
          <label className="block text-sm font-semibold text-slate-900" htmlFor="image-pdf-page-size">页面尺寸</label>
          <select className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isAdding || isProcessing} id="image-pdf-page-size" onChange={(event) => setPageMode(event.target.value as ImagePageMode)} value={pageMode}>
            <option value="original">原图比例</option>
            <option value="a4">A4（自动横竖版）</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">原图比例不留白；A4 会保留页边距并完整放入图片，不裁切。</p>
          <button className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!images.length || isAdding || isProcessing} onClick={() => void exportPdf()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在生成" : "生成并下载 PDF"}
          </button>
        </div>
      </div>

      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
