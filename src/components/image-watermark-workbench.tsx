"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Droplets, LoaderCircle } from "lucide-react";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { loadImageFromFile } from "@/lib/image-bitmap";
import { computeWatermarkAnchor, type WatermarkPosition } from "@/lib/image-watermark";

const POSITION_OPTIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "左上" },
  { value: "top-center", label: "上中" },
  { value: "top-right", label: "右上" },
  { value: "center", label: "居中" },
  { value: "bottom-left", label: "左下" },
  { value: "bottom-center", label: "下中" },
  { value: "bottom-right", label: "右下" },
];

export function ImageWatermarkWorkbench() {
  const [file, setFile] = useState<File>();
  const [text, setText] = useState("仅供参考");
  const [fontSizePercent, setFontSizePercent] = useState(6);
  const [opacityPercent, setOpacityPercent] = useState(45);
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [color, setColor] = useState("#ffffff");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择图片后输入水印文字。\n");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !file) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const maxPreviewWidth = 900;
    const scale = Math.min(maxPreviewWidth / image.width, 1);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const fontSizePx = Math.max(12, Math.round((canvas.width * fontSizePercent) / 100));
    context.font = `bold ${fontSizePx}px sans-serif`;
    context.globalAlpha = opacityPercent / 100;
    context.fillStyle = color;
    const metrics = context.measureText(text || "水印");
    const anchor = computeWatermarkAnchor({
      imageWidth: canvas.width,
      imageHeight: canvas.height,
      boxWidth: metrics.width,
      boxHeight: fontSizePx,
      position,
      marginRatio: 0.04,
    });
    context.textBaseline = "top";
    context.fillText(text || "水印", anchor.x, anchor.y);
    context.globalAlpha = 1;
  }, [file, text, fontSizePercent, opacityPercent, position, color]);

  async function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;
    try {
      const loaded = await loadImageFromFile(selectedFile);
      imageRef.current = loaded.element;
      setFile(selectedFile);
      setMessage(`已载入 ${loaded.width}×${loaded.height} 的图片。`);
    } catch {
      setMessage("无法读取这张图片，请换一个文件试试。\n");
    }
  }

  async function exportWatermarked() {
    if (!file || !imageRef.current) return;

    setIsProcessing(true);
    setMessage("正在浏览器本地添加水印…");
    try {
      const image = imageRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no-canvas");

      context.drawImage(image, 0, 0);
      const fontSizePx = Math.max(14, Math.round((canvas.width * fontSizePercent) / 100));
      context.font = `bold ${fontSizePx}px sans-serif`;
      context.globalAlpha = opacityPercent / 100;
      context.fillStyle = color;
      const metrics = context.measureText(text.trim() || "水印");
      const anchor = computeWatermarkAnchor({
        imageWidth: canvas.width,
        imageHeight: canvas.height,
        boxWidth: metrics.width,
        boxHeight: fontSizePx,
        position,
        marginRatio: 0.04,
      });
      context.textBaseline = "top";
      context.fillText(text.trim() || "水印", anchor.x, anchor.y);

      const mimeType = /png$/i.test(file.type) ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, 0.92));
      if (!blob) throw new Error("encode-failed");
      triggerDownload(blob, getDownloadFileName(file.name, "-watermark", mimeType === "image/png" ? "png" : "jpg"));
      setMessage("水印已添加完成，下载应已开始。");
    } catch {
      setMessage("添加水印失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="图片加水印工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Droplets aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">图片加水印</h2>
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
          {file && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <canvas className="block h-auto max-h-[70vh] w-full" ref={canvasRef} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-900" htmlFor="img-wm-text">水印文字</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="img-wm-text" onChange={(event) => setText(event.target.value)} type="text" value={text} />

          <label className="block text-sm font-semibold text-slate-900">
            文字大小 <span className="font-medium text-slate-500">{fontSizePercent}%</span>
            <input className="mt-2 w-full accent-emerald-700" max="20" min="2" onChange={(event) => setFontSizePercent(Number(event.target.value))} step="1" type="range" value={fontSizePercent} />
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            不透明度 <span className="font-medium text-slate-500">{opacityPercent}%</span>
            <input className="mt-2 w-full accent-emerald-700" max="100" min="10" onChange={(event) => setOpacityPercent(Number(event.target.value))} step="5" type="range" value={opacityPercent} />
          </label>

          <label className="block text-sm font-semibold text-slate-900">
            位置
            <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setPosition(event.target.value as WatermarkPosition)} value={position}>
              {POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">颜色</span>
            {[["#ffffff", "白色"], ["#111111", "黑色"]].map(([value, label]) => (
              <button className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${color === value ? "border-emerald-700 text-emerald-700" : "border-slate-300 text-slate-600"}`} key={value} onClick={() => setColor(value)} type="button">
                <span className="size-3 rounded-full border border-slate-300" style={{ backgroundColor: value }} />{label}
              </button>
            ))}
          </div>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void exportWatermarked()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在处理" : "加水印并下载"}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
