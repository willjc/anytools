"use client";

import { useState } from "react";
import { Download, LoaderCircle, Minimize2 } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";

export function PdfCompressWorkbench() {
  const [file, setFile] = useState<File>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择 PDF 后上传到服务器压缩，处理完成即可下载。\n");

  async function selectPdf(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setMessage("请选择 PDF 文件。\n");
      return;
    }
    setFile(selectedFile);
    setMessage(`已选择 ${formatFileSize(selectedFile.size)} 的文件。`);
  }

  async function compress() {
    if (!file) return;

    setIsProcessing(true);
    setMessage("已上传，服务器正在压缩…");
    try {
      const blob = await uploadForProcessing("pdf-compress", file);
      triggerDownload(blob, getDownloadFileName(file.name, "-compressed", "pdf"));
      setMessage(`压缩完成：${formatFileSize(file.size)} → ${formatFileSize(blob.size)}，下载应已开始。`);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "压缩失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 压缩工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Minimize2 aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 压缩</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">文件处理后即删</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择 PDF 文件
          <input accept=".pdf,application/pdf" className="sr-only" type="file" onChange={(event) => { void selectPdf(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void compress()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在压缩" : "上传并压缩"}
        </button>

        <p className="text-xs leading-5 text-slate-500">该功能在服务器端使用 qpdf 重建文件流，视觉内容不变、体积更小；服务器不会保存你的文件。</p>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
