"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Download, Layers, LoaderCircle, Plus, Trash2 } from "lucide-react";

import { triggerDownload } from "@/lib/file-utils";
import { loadImageFromFile } from "@/lib/image-bitmap";
import { computeStitchLayout, type StitchDirection, type StitchSourceSize } from "@/lib/image-stitch";

type QueuedImage = {
  id: string;
  file: File;
  element: HTMLImageElement;
};

export function ImageStitchWorkbench() {
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [direction, setDirection] = useState<StitchDirection>("vertical");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择两张或以上图片，按顺序拼接成长图。\n");

  async function addFiles(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const loadedList: QueuedImage[] = [];
    for (const file of Array.from(selectedFiles)) {
      try {
        const loaded = await loadImageFromFile(file);
        loadedList.push({ id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`, file, element: loaded.element });
      } catch {
        setMessage(`无法读取 ${file.name}，已跳过。\n`);
      }
    }
    if (loadedList.length > 0) {
      setImages((current) => [...current, ...loadedList]);
      setMessage(`已加入 ${loadedList.length} 张图片。`);
    }
  }

  function move(id: string, offset: number) {
    setImages((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function stitch() {
    if (images.length < 2) {
      setMessage("请至少选择两张图片。\n");
      return;
    }

    setIsProcessing(true);
    setMessage("正在浏览器本地拼接…");
    try {
      const sizes: StitchSourceSize[] = images.map((image) => ({ width: image.element.naturalWidth, height: image.element.naturalHeight }));
      const layout = computeStitchLayout(sizes, direction);

      const canvas = document.createElement("canvas");
      canvas.width = layout.canvasWidth;
      canvas.height = layout.canvasHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no-canvas");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      images.forEach((image, index) => {
        const size = layout.scaledSizes[index];
        context.drawImage(image.element, layout.offsets[index].x, layout.offsets[index].y, size.width, size.height);
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("encode-failed");
      triggerDownload(blob, `stitched-${direction}.png`);
      setMessage(`已拼接 ${images.length} 张图片为 ${canvas.width}×${canvas.height} 的长图，下载应已开始。`);
    } catch {
      setMessage("拼接失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="图片拼接工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Layers aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">图片拼接</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{images.length} 张图片</span>
      </div>

      <div className="mt-7 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            <Plus aria-hidden="true" className="size-4" /> 添加图片
            <input accept=".jpg,.jpeg,.png,.webp,image/*" className="sr-only" multiple type="file" onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
          </label>
          <div className="flex gap-2">
            {[["vertical", "纵向拼接"], ["horizontal", "横向拼接"]].map(([value, label]) => (
              <button className={`rounded-full border px-4 py-2 text-xs font-medium transition ${direction === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`} key={value} onClick={() => setDirection(value as StitchDirection)} type="button">{label}</button>
            ))}
          </div>
        </div>

        {images.length > 0 && (
          <ul className="space-y-2">
            {images.map((image, index) => (
              <li className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5" key={image.id}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={image.file.name} className="size-10 shrink-0 rounded-md object-cover" src={image.element.src} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{image.file.name}</span>
                <button aria-label="上移" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:opacity-30" disabled={index === 0} onClick={() => move(image.id, -1)} type="button"><ArrowUp className="size-4" /></button>
                <button aria-label="下移" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:opacity-30" disabled={index === images.length - 1} onClick={() => move(image.id, 1)} type="button"><ArrowDown className="size-4" /></button>
                <button aria-label="移除" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600" onClick={() => setImages((current) => current.filter((entry) => entry.id !== image.id))} type="button"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={images.length < 2 || isProcessing} onClick={() => void stitch()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在拼接" : "拼接并下载 PNG"}
        </button>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
