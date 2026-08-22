"use client";

import { useMemo, useState } from "react";
import { Download, ImageUp, LoaderCircle } from "lucide-react";

import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";

type ImageFormat = "image/jpeg" | "image/png" | "image/webp";

const formatOptions: { value: ImageFormat; label: string; extension: string }[] = [
  { value: "image/webp", label: "WebP", extension: "webp" },
  { value: "image/jpeg", label: "JPEG", extension: "jpg" },
  { value: "image/png", label: "PNG", extension: "png" },
];

const acceptedInputTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: ImageFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Unable to create image"))), type, type === "image/png" ? undefined : quality);
  });
}

export function ImageWorkbench({ mode }: { mode: "compress" | "convert" }) {
  const [file, setFile] = useState<File>();
  const [quality, setQuality] = useState(0.82);
  const [format, setFormat] = useState<ImageFormat>(mode === "compress" ? "image/webp" : "image/png");
  const [message, setMessage] = useState("选择一张图片后即可在浏览器本地处理。\n");
  const [isProcessing, setIsProcessing] = useState(false);
  const selectedFormat = useMemo(() => formatOptions.find((option) => option.value === format)!, [format]);

  function selectFile(nextFile: File | undefined) {
    if (!nextFile) return;
    if (!acceptedInputTypes.has(nextFile.type)) {
      setFile(undefined);
      setMessage("请选择 PNG、JPEG 或 WebP 图片。\n");
      return;
    }
    setFile(nextFile);
    setMessage(`已选择 ${nextFile.name}（${formatFileSize(nextFile.size)}）。`);
  }

  async function processImage() {
    if (!file) return;
    setIsProcessing(true);
    setMessage("正在浏览器本地处理图片…");

    try {
      const image = await readImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");

      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0);

      const output = await canvasToBlob(canvas, format, quality);
      const suffix = mode === "compress" ? "-compressed" : "-converted";
      triggerDownload(output, getDownloadFileName(file.name, suffix, selectedFormat.extension));
      const direction = output.size < file.size ? `体积减少 ${formatFileSize(file.size - output.size)}` : `导出文件为 ${formatFileSize(output.size)}`;
      setMessage(`已生成 ${selectedFormat.label} 图片（${direction}），下载应已开始。`);
    } catch {
      setMessage("处理失败。请改用 PNG、JPEG 或 WebP 格式的普通图片。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  const isCompress = mode === "compress";
  const heading = isCompress ? "压缩图片" : "转换图片格式";
  const action = isCompress ? "压缩并下载" : "转换并下载";

  return (
    <section aria-label={`${heading}工作区`} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ImageUp aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{heading}</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">PNG · JPEG · WebP</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <label className="group grid min-h-52 cursor-pointer place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40">
          <input accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} type="file" />
          <ImageUp aria-hidden="true" className="size-9 text-emerald-700" />
          <span className="mt-3 text-sm font-semibold text-slate-900">选择图片</span>
          <span className="mt-1 text-xs leading-5 text-slate-500">不会上传到服务器</span>
          {file ? <span className="mt-4 max-w-full truncate rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700">{file.name} · {formatFileSize(file.size)}</span> : null}
        </label>

        <div className="rounded-3xl bg-slate-50 p-5 sm:p-6">
          <label className="block text-sm font-semibold text-slate-900" htmlFor={`${mode}-format`}>导出格式</label>
          <select className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id={`${mode}-format`} onChange={(event) => setFormat(event.target.value as ImageFormat)} value={format}>
            {formatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <label className="mt-5 block text-sm font-semibold text-slate-900" htmlFor={`${mode}-quality`}>画质 <span className="font-medium text-slate-500">{Math.round(quality * 100)}%</span></label>
          <input className="mt-3 w-full accent-emerald-700" disabled={format === "image/png"} id={`${mode}-quality`} max="0.98" min="0.4" onChange={(event) => setQuality(Number(event.target.value))} step="0.01" type="range" value={quality} />
          <p className="mt-2 text-xs leading-5 text-slate-500">{format === "image/png" ? "PNG 为无损导出，画质设置不适用。" : "较低画质通常可获得更小的文件。"}</p>
          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void processImage()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在处理" : action}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
