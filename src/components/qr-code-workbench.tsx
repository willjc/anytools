"use client";

import { useState } from "react";
import { Download, LoaderCircle, QrCode } from "lucide-react";
import QRCode from "qrcode";

export function QrCodeWorkbench() {
  const [content, setContent] = useState("");
  const [size, setSize] = useState(512);
  const [dataUrl, setDataUrl] = useState("");
  const [message, setMessage] = useState("输入文本或链接，再点击“生成二维码”。");
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateCode() {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setDataUrl("");
      setMessage("请输入要编码的文本或网址。\n");
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    try {
      const nextDataUrl = await QRCode.toDataURL(trimmedContent, { errorCorrectionLevel: "M", margin: 2, width: size });
      setDataUrl(nextDataUrl);
      setMessage("二维码已在浏览器本地生成，可直接下载 PNG。\n");
    } catch {
      setDataUrl("");
      setMessage("无法生成二维码，请缩短内容后重试。\n");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section aria-label="二维码生成器工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><QrCode aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">生成二维码</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">下载 PNG</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl bg-slate-50 p-5 sm:p-6">
          <label className="block text-sm font-semibold text-slate-900" htmlFor="qr-content">文本或网址</label>
          <textarea className="mt-3 min-h-36 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="qr-content" onChange={(event) => { setContent(event.target.value); setDataUrl(""); }} placeholder="https://example.com 或任意文本" value={content} />
          <label className="mt-5 block text-sm font-semibold text-slate-900" htmlFor="qr-size">图片尺寸 <span className="font-medium text-slate-500">{size} × {size}</span></label>
          <input className="mt-3 w-full accent-emerald-700" id="qr-size" max="1024" min="256" onChange={(event) => { setSize(Number(event.target.value)); setDataUrl(""); }} step="64" type="range" value={size} />
          <p className="mt-2 text-xs leading-5 text-slate-500">二维码内容仅在当前浏览器中生成，不会发送到服务器。</p>
          <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isGenerating} onClick={() => void generateCode()} type="button">
            {isGenerating ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <QrCode aria-hidden="true" className="size-4" />}
            {isGenerating ? "正在生成" : "生成二维码"}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {dataUrl ? <img alt="生成的二维码预览" className="size-52 max-w-full rounded-xl border border-slate-100 object-contain p-2" src={dataUrl} /> : <div className="grid size-52 place-items-center rounded-xl bg-slate-100 text-sm text-slate-500">等待输入内容</div>}
          <a className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 aria-disabled:cursor-not-allowed aria-disabled:bg-slate-300" aria-disabled={!dataUrl || isGenerating} download="qrcode.png" href={dataUrl || undefined} onClick={(event) => { if (!dataUrl || isGenerating) event.preventDefault(); }}>
            {isGenerating ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isGenerating ? "正在生成" : "下载二维码"}
          </a>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
