"use client";

import { useState } from "react";
import { Download, Grid3x3, LoaderCircle } from "lucide-react";

import { loadImageFromFile } from "@/lib/image-bitmap";
import { computeGridSlices } from "@/lib/image-grid";

type SlicePreview = {
  row: number;
  column: number;
  dataUrl: string;
};

export function ImageGridWorkbench() {
  const [fileName, setFileName] = useState("");
  const [slices, setSlices] = useState<SlicePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择一张图片，自动切成 3×3 九张。\n");

  async function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    setIsProcessing(true);
    setMessage("正在浏览器本地切图…");
    try {
      const loaded = await loadImageFromFile(selectedFile);
      const sliceRects = computeGridSlices(loaded.width, loaded.height);

      const previews: SlicePreview[] = [];
      for (let index = 0; index < sliceRects.length; index += 1) {
        const rect = sliceRects[index];
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("no-canvas");
        context.drawImage(loaded.element, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
        previews.push({ row: Math.floor(index / 3), column: index % 3, dataUrl: canvas.toDataURL("image/png") });
      }

      setFileName(selectedFile.name.replace(/\.[^.]+$/, "") || "image");
      setSlices(previews);
      setMessage(`已切成九张 ${Math.round(sliceRects[0].width)}×${Math.round(sliceRects[0].height)} 的图片，点击图片下方按钮逐张下载。`);
    } catch {
      setSlices([]);
      setMessage("无法读取这张图片，请换一个文件试试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadSlice(slice: SlicePreview) {
    const anchor = document.createElement("a");
    anchor.href = slice.dataUrl;
    anchor.download = `${fileName}-grid-${slice.row * 3 + slice.column + 1}.png`;
    anchor.click();
  }

  function downloadAll() {
    slices.forEach((slice, index) => {
      window.setTimeout(() => downloadSlice(slice), index * 250);
    });
    setMessage("正在逐张下载，若浏览器询问请允许下载多个文件。");
  }

  return (
    <section aria-label="九宫格切图工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Grid3x3 aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">九宫格切图</h2>
          </div>
        </div>
        {slices.length > 0 && (
          <button className="w-fit rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800" onClick={downloadAll} type="button">一键下载全部</button>
        )}
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择图片
          <input accept=".jpg,.jpeg,.png,.webp,image/*" className="sr-only" type="file" onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = ""; }} />
        </label>

        {slices.length > 0 && (
          <div className="mx-auto grid max-w-md grid-cols-3 overflow-hidden rounded-2xl border border-slate-200">
            {slices.map((slice) => (
              <div key={`${slice.row}-${slice.column}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`第 ${slice.row * 3 + slice.column + 1} 格`} className="block aspect-square w-full object-cover" src={slice.dataUrl} />
              </div>
            ))}
          </div>
        )}

        {slices.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            {slices.map((slice) => (
              <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700" key={`dl-${slice.row}-${slice.column}`} onClick={() => downloadSlice(slice)} type="button"><Download aria-hidden="true" className="size-3.5" />{slice.row * 3 + slice.column + 1}</button>
            ))}
          </div>
        )}

        {isProcessing && (
          <p className="inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> 正在处理…</p>
        )}
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
