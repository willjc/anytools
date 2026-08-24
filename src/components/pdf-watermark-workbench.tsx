"use client";

import { useState } from "react";
import { Download, LoaderCircle, Stamp } from "lucide-react";
import { PDFDocument } from "pdf-lib";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { watermarkPdfBytes } from "@/lib/pdf-watermark";

async function renderTextTile(text: string, fontSizePx: number): Promise<{ bytes: Uint8Array; widthPt: number; heightPt: number }> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法创建水印画布。");
  }

  const font = `bold ${fontSizePx}px sans-serif`;
  context.font = font;
  const textWidth = Math.ceil(context.measureText(text).width);
  canvas.width = textWidth + 16;
  canvas.height = fontSizePx + 12;

  context.font = font;
  context.fillStyle = "#808080";
  context.textBaseline = "middle";
  context.fillText(text, 8, canvas.height / 2);

  const dataUrl = canvas.toDataURL("image/png");
  const response = await fetch(dataUrl);
  const buffer = await response.arrayBuffer();
  return {
    bytes: new Uint8Array(buffer),
    // 1 CSS pixel ≈ 0.75 pt; keeps on-page size close to the chosen font size.
    widthPt: (textWidth + 16) * 0.75,
    heightPt: (fontSizePx + 12) * 0.75,
  };
}

export function PdfWatermarkWorkbench() {
  const [file, setFile] = useState<File>();
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState("内部资料 禁止外传");
  const [opacityPercent, setOpacityPercent] = useState(18);
  const [angle, setAngle] = useState(-30);
  const [density, setDensity] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择 PDF 后输入水印文字。\n");

  async function selectPdf(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setMessage("请选择 PDF 文件。\n");
      return;
    }
    try {
      const count = (await PDFDocument.load(await selectedFile.arrayBuffer())).getPageCount();
      setFile(selectedFile);
      setPageCount(count);
      setMessage(`已读取 ${count} 页。`);
    } catch {
      setFile(undefined);
      setPageCount(0);
      setMessage("无法读取此 PDF，可能已损坏或加密。\n");
    }
  }

  async function applyWatermark() {
    if (!file) return;
    const trimmedText = text.trim();
    if (!trimmedText) {
      setMessage("请输入水印文字。\n");
      return;
    }

    setIsProcessing(true);
    setMessage("正在浏览器本地添加水印…");
    try {
      const tile = await renderTextTile(trimmedText, 28);
      const stepX = tile.widthPt / density + tile.widthPt;
      const stepY = tile.heightPt * 1.6 / density + tile.heightPt * 1.4;
      const bytes = await watermarkPdfBytes(await file.arrayBuffer(), {
        tilePngBytes: tile.bytes,
        tileWidthPt: tile.widthPt,
        tileHeightPt: tile.heightPt,
        opacity: opacityPercent / 100,
        angleDeg: angle,
        stepX,
        stepY,
      });
      triggerDownload(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }), getDownloadFileName(file.name, "-watermarked", "pdf"));
      setMessage("水印已添加完成，下载应已开始。");
    } catch {
      setMessage("添加水印失败，请确认文件是未加密的标准 PDF。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 加水印工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Stamp aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 加水印</h2>
          </div>
        </div>
        {pageCount > 0 && <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">共 {pageCount} 页</span>}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="rounded-3xl bg-slate-50 p-5 sm:p-6">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            选择 PDF 文件
            <input accept=".pdf,application/pdf" className="sr-only" type="file" onChange={(event) => { void selectPdf(event.target.files?.[0]); event.target.value = ""; }} />
          </label>
          {file && <p className="mt-3 truncate text-sm font-medium text-slate-900">{file.name}</p>}

          <label className="mt-5 block text-sm font-semibold text-slate-900" htmlFor="wm-text">水印文字</label>
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="wm-text" onChange={(event) => setText(event.target.value)} type="text" value={text} />

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-slate-900">
              不透明度 <span className="font-medium text-slate-500">{opacityPercent}%</span>
              <input className="mt-2 w-full accent-emerald-700" max="60" min="5" onChange={(event) => setOpacityPercent(Number(event.target.value))} step="1" type="range" value={opacityPercent} />
            </label>
            <label className="block text-sm font-semibold text-slate-900">
              角度 <span className="font-medium text-slate-500">{angle}°</span>
              <input className="mt-2 w-full accent-emerald-700" max={0} min="-90" onChange={(event) => setAngle(Number(event.target.value))} step="5" type="range" value={angle} />
            </label>
            <label className="block text-sm font-semibold text-slate-900">
              密度 <span className="font-medium text-slate-500">{"低 中 高".split(" ")[density - 1]}</span>
              <input className="mt-2 w-full accent-emerald-700" max="3" min="1" onChange={(event) => setDensity(Number(event.target.value))} step="1" type="range" value={density} />
            </label>
          </div>

          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void applyWatermark()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在处理" : "添加水印并下载"}
          </button>
        </div>

        <div className="flex flex-col justify-center rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">效果示意</p>
          <div className="relative mt-3 aspect-[210/297] overflow-hidden rounded-xl border border-slate-100 bg-white">
            <div
              className="absolute inset-[-40%] flex flex-wrap items-center justify-around gap-6 overflow-hidden"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              {Array.from({ length: 36 }).map((_, index) => (
                <span className="whitespace-nowrap text-sm text-slate-400" key={index} style={{ opacity: opacityPercent / 100 }}>{text || "水印文字"}</span>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">水印会平铺在每一页上，支持任意中英文文字。</p>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
