"use client";

import { useRef, useState } from "react";
import { Crop, Download, LoaderCircle } from "lucide-react";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { loadImageFromFile } from "@/lib/image-bitmap";

const RATIOS = [
  { label: "自由", w: 0, h: 0 },
  { label: "1:1", w: 1, h: 1 },
  { label: "4:3", w: 4, h: 3 },
  { label: "3:4", w: 3, h: 4 },
  { label: "16:9", w: 16, h: 9 },
  { label: "9:16", w: 9, h: 16 },
] as const;

type Selection = { left: number; top: number; width: number; height: number };

export function ImageCropWorkbench() {
  const [file, setFile] = useState<File>();
  const [ratioIndex, setRatioIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择图片后拖动框选裁剪区域。\n");
  const [selection, setSelection] = useState<Selection>();
  const [previewUrl, setPreviewUrl] = useState("");
  const dragStartRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const imageRef = useRef<HTMLDivElement>(null);

  async function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;
    try {
      const loaded = await loadImageFromFile(selectedFile);
      if (loaded.width === 0 || loaded.height === 0) throw new Error("empty");
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return loaded.element.src;
      });
      setFile(selectedFile);
      setSelection(undefined);
      setMessage(`已载入 ${loaded.width}×${loaded.height} 的图片。`);
    } catch {
      setMessage("无法读取这张图片，请换一个文件试试。\n");
    }
  }

  function applyRatioToSelection(index: number) {
    setRatioIndex(index);
    setSelection(undefined);
    dragStartRef.current = undefined;
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

  async function exportCrop() {
    if (!file || !selection) return;
    const container = imageRef.current;
    if (!container) return;

    const displayed = container.querySelector("img");
    if (!displayed) return;
    const { naturalWidth, naturalHeight } = displayed;
    const scaleX = naturalWidth / displayed.clientWidth;
    const scaleY = naturalHeight / displayed.clientHeight;

    setIsProcessing(true);
    setMessage("正在浏览器本地裁剪…");
    try {
      const sourceX = Math.max(0, Math.round(selection.left * scaleX));
      const sourceY = Math.max(0, Math.round(selection.top * scaleY));
      const sourceWidth = Math.min(naturalWidth - sourceX, Math.round(selection.width * scaleX));
      const sourceHeight = Math.min(naturalHeight - sourceY, Math.round(selection.height * scaleY));
      if (sourceWidth < 2 || sourceHeight < 2) {
        setMessage("选区太小了，请重新框选。\n");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no-canvas");
      context.drawImage(displayed, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

      const mimeType = /png$/i.test(file.type) ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, 0.92));
      if (!blob) throw new Error("encode-failed");
      triggerDownload(blob, getDownloadFileName(file.name, "-cropped", mimeType === "image/png" ? "png" : "jpg"));
      setMessage(`已裁剪出 ${sourceWidth}×${sourceHeight} 的图片，下载应已开始。`);
    } catch {
      setMessage("裁剪失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="图片裁剪工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Crop aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">图片裁剪</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">原图不离开浏览器</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.55fr]">
        <div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            选择图片
            <input accept=".jpg,.jpeg,.png,.webp,image/*" className="sr-only" type="file" onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = ""; }} />
          </label>

          <div ref={imageRef} className={`relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] ${file ? "" : "hidden"}`} onMouseDown={(event) => { const point = relativePoint(event); dragStartRef.current = point; setSelection({ left: point.x, top: point.y, width: 0, height: 0 }); }} onMouseMove={(event) => {
            if (!dragStartRef.current) return;
            const point = relativePoint(event);
            const ratio = RATIOS[ratioIndex];
            let width = Math.abs(point.x - dragStartRef.current.x);
            let height = Math.abs(point.y - dragStartRef.current.y);
            if (ratio.w > 0 && ratio.h > 0 && width > 0 && height > 0) {
              const target = ratio.w / ratio.h;
              if (width / height > target) width = height * target;
              else height = width / target;
            }
            setSelection({
              left: point.x >= dragStartRef.current.x ? dragStartRef.current.x : Math.max(0, dragStartRef.current.x - width),
              top: point.y >= dragStartRef.current.y ? dragStartRef.current.y : Math.max(0, dragStartRef.current.y - height),
              width,
              height,
            });
          }} onMouseUp={() => { dragStartRef.current = undefined; }} onMouseLeave={() => { dragStartRef.current = undefined; }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="待裁剪的原图" className="block h-auto max-h-[70vh] w-full select-none object-contain" draggable={false} src={previewUrl} />
            {selection && (
              <div className="pointer-events-none absolute border-2 border-emerald-600 bg-emerald-300/20" style={{ left: selection.left, top: selection.top, width: selection.width, height: selection.height }} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-900">比例预设</p>
          <div className="flex flex-wrap gap-2">
            {RATIOS.map((ratio, index) => (
              <button className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${ratioIndex === index ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700"}`} key={ratio.label} onClick={() => applyRatioToSelection(index)} type="button">{ratio.label}</button>
            ))}
          </div>
          <p className="text-xs leading-5 text-slate-500">选择预设后直接在图上拖动，选区会按该比例参考；也可以完全自由拖动。</p>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || !selection || isProcessing} onClick={() => void exportCrop()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在裁剪" : "裁剪并下载"}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
