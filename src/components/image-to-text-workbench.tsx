"use client";

import { useState } from "react";
import { Check, Copy, Download, LoaderCircle, ScanText } from "lucide-react";

import { formatFileSize } from "@/lib/file-utils";

type OcrResult = {
  text: string;
  markdown: string;
  truncated: boolean;
};

export function ImageToTextWorkbench() {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<OcrResult>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("上传图片即可提取其中的文字，识别由 MinerU 云端完成，请保持页面打开。\n");

  async function recognize() {
    if (!file) return;

    setIsProcessing(true);
    setResult(undefined);
    setMessage("正在上传并识别，通常需要十几秒到一分钟…");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/tools/image-to-text", { method: "POST", body: formData });
      const data = (await response.json()) as Partial<OcrResult> & { error?: string };
      if (!response.ok) {
        setMessage(`${data.error ?? "识别失败，请稍后重试。"}\n`);
        return;
      }
      const payload: OcrResult = { text: data.text ?? "", markdown: data.markdown ?? "", truncated: Boolean(data.truncated) };
      setResult(payload);
      setMessage(payload.text ? "识别完成，文字已提取，可直接复制或下载。" : "识别完成，但没有提取到文字；截图类图片建议清晰一些再试。");
    } catch {
      setMessage("识别失败，请检查网络后重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  async function copyText() {
    if (!result?.text) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function downloadText() {
    if (!result) return;
    const blob = new Blob([result.text], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(file?.name ?? "图片").replace(/\.[^.]+$/, "")}-文字.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-label="图片转文字工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#dcecfa] text-sky-800">
            <ScanText aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">MinerU 云端识别</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">图片转文字</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">支持截图 / 照片 / 表单</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div>
            <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
              选择图片
              <input
                accept=".png,.jpg,.jpeg,.jp2,.webp,.gif,.bmp,image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  setFile(selected);
                  setResult(undefined);
                  if (selected) setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}），点击「开始识别」。`);
                  event.target.value = "";
                }}
                type="file"
              />
            </label>
            {file && <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!file || isProcessing}
            onClick={() => void recognize()}
            type="button"
          >
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <ScanText aria-hidden="true" className="size-4" />}
            {isProcessing ? "识别中（约十几秒到一分钟）" : "开始识别"}
          </button>
          <p className="text-xs leading-5 text-slate-500">识别在 MinerU 云端完成，图片处理完即删除；表格会以文本形式还原，复杂公式建议使用「文档转 Markdown」。</p>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">识别结果</p>
            {result?.text && (
              <div className="flex items-center gap-1">
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => void copyText()}
                  type="button"
                >
                  {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
                  {copied ? "已复制" : "复制"}
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={downloadText}
                  type="button"
                >
                  <Download aria-hidden="true" className="size-3.5" />
                  下载 TXT
                </button>
              </div>
            )}
          </div>
          {result ? (
            <textarea
              aria-label="识别出的文字"
              className="mt-2 h-72 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-emerald-600"
              readOnly
              value={result.text + (result.truncated ? "\n\n（内容过长，仅显示前一部分）" : "")}
            />
          ) : (
            <div className="mt-2 grid h-72 place-items-center rounded-2xl border border-dashed border-slate-300 px-4 text-center">
              <div>
                <ScanText aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">{isProcessing ? "识别中，请稍候…" : "还没有识别结果"}</p>
                <p className="mt-1 text-xs text-slate-400">{isProcessing ? "图片较大或文字较多时会更久" : "上传图片并点击「开始识别」"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
