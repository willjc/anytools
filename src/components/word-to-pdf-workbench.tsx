"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, LoaderCircle } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";

export function WordToPdfWorkbench() {
  const [file, setFile] = useState<File>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择 Word 文档上传，服务器转换后返回 PDF。\n");
  const [isError, setIsError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function convert() {
    if (!file) return;

    setIsProcessing(true);
    setIsError(false);
    setMessage("上传并转换中，复杂文档可能需要几十秒…");
    try {
      const blob = await uploadForProcessing("word-to-pdf", file);
      if (!mountedRef.current) return;
      triggerDownload(blob, getDownloadFileName(file.name, "", "pdf"));
      setMessage(`转换完成（${formatFileSize(blob.size)}），下载应已开始。`);
    } catch (error) {
      if (!mountedRef.current) return;
      setIsError(true);
      setMessage(error instanceof Error ? `${error.message}\n` : "转换失败，请重试。\n");
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }

  return (
    <section aria-label="Word 转 PDF 工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FileText aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Word 转 PDF</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">支持 .doc / .docx · 用后即删</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
          选择 Word 文件
          <input accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={isProcessing} type="file" onChange={(event) => { const selected = event.target.files?.[0]; setFile(selected); if (selected) { setIsError(false); setMessage(`已选择 ${formatFileSize(selected.size)} 的文件。`); } event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}

        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void convert()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在转换" : "上传并转换为 PDF"}
        </button>
        <p className="text-xs leading-5 text-slate-500">由服务器端 LibreOffice 完成转换，文件只用于本次任务并在转换后清理。当前站点使用 HTTP，上传内容在传输途中未加密，请勿处理敏感文档。</p>
      </div>
      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
