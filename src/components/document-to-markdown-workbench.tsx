"use client";

import { useState } from "react";
import { Download, FileScan, LoaderCircle } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";

export function DocumentToMarkdownWorkbench() {
  const [file, setFile] = useState<File>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [message, setMessage] = useState("选择 Word、PDF 或图片，MinerU 将识别正文、表格与公式。");

  async function convert() {
    if (!file) return;
    setIsProcessing(true);
    setHasError(false);
    setMessage("文件已提交 MinerU，识别通常需要几十秒，请保持页面打开…");
    try {
      const blob = await uploadForProcessing("document-to-markdown", file);
      triggerDownload(blob, getDownloadFileName(file.name, "", "md"));
      setMessage(`识别完成（${formatFileSize(blob.size)}），Markdown 下载应已开始。`);
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "识别失败，请重试。");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="文档转 Markdown 工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-800"><FileScan aria-hidden="true" className="size-6" /></span>
          <div><p className="text-sm font-medium text-sky-700">MinerU 云端识别</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">文档转 Markdown</h2></div>
        </div>
        <span className="w-fit rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">输出 .md</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择 Word、PDF 或图片
          <input accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,.jp2,.webp,.gif,.bmp" className="sr-only" type="file" onChange={(event) => { const selected = event.target.files?.[0]; setFile(selected); setHasError(false); if (selected) setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}）。`); event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void convert()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "MinerU 识别中" : "识别并下载 Markdown"}
        </button>
        <p className="text-xs leading-5 text-slate-500">文件会上传到本服务器并转交 MinerU 解析；请勿上传不适合交由第三方云服务处理的敏感文件。</p>
      </div>
      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${hasError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
