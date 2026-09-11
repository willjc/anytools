"use client";

import { useState } from "react";
import { Download, LoaderCircle, Scissors } from "lucide-react";

import { formatFileSize } from "@/lib/file-utils";

const CHECKER = {
  backgroundImage:
    "conic-gradient(#e8e6e2 0 25%, #ffffff 0 50%, #e8e6e2 0 75%, #ffffff 0)",
  backgroundSize: "16px 16px",
};

export function RemoveBgWorkbench() {
  const [file, setFile] = useState<File>();
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("上传人物 / 商品 / 物品照片，一键去除背景生成透明 PNG，全部由服务器 AI 模型处理。\n");

  async function process(selected: File) {
    setIsProcessing(true);
    setResultUrl("");
    setMessage("AI 正在抠图，通常几秒钟…");
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const response = await fetch("/api/tools/remove-bg", { method: "POST", body: formData });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(`${data?.error ?? "去背景失败，请换一张图片试试。"}\n`);
        return;
      }
      const blob = await response.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setMessage(`完成！透明背景 PNG（${formatFileSize(blob.size)}），点击下载即可使用。`);
    } catch {
      setMessage("处理失败，请检查网络后重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="图片去背景工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#dcecfa] text-sky-800">
            <Scissors aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端 AI 模型 · 用后即删</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">图片去背景</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">输出透明 PNG</span>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            选择图片（JPG / PNG / WebP）
            <input
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                setFile(selected);
                setResultUrl("");
                if (selected) {
                  setOriginalUrl(URL.createObjectURL(selected));
                  setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}），自动开始处理…`);
                  void process(selected);
                }
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          {file && <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}
        </div>

        {isProcessing && (
          <p className="inline-flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            AI 模型抠图中…
          </p>
        )}

        {resultUrl && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">原图</p>
              <div className="grid place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="原图" className="max-h-64 w-auto max-w-full" src={originalUrl} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">去背景后（{formatFileSize(resultSize)}）</p>
              <div className="grid place-items-center overflow-hidden rounded-2xl border border-slate-200 p-2" style={CHECKER}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="去背景结果" className="max-h-64 w-auto max-w-full" src={resultUrl} />
              </div>
            </div>
            <a
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:col-span-2 sm:w-auto"
              download={`${file?.name.replace(/\.[^.]+$/, "") ?? "image"}-去背景.png`}
              href={resultUrl}
            >
              <Download aria-hidden="true" className="size-4" />
              下载透明 PNG
            </a>
          </div>
        )}

        <p className="text-xs leading-5 text-slate-500">使用开源 rembg 模型（u2netp）在服务器处理，图片处理完立即删除；人像、商品、简单背景效果最佳。</p>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
