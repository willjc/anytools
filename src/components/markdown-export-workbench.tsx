"use client";

import { useState } from "react";
import { Download, FileText, LoaderCircle } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";

export function MarkdownExportWorkbench() {
  const [file, setFile] = useState<File>();
  const [format, setFormat] = useState<"docx" | "pdf">("docx");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [message, setMessage] = useState("选择 UTF-8 编码的 Markdown 文件，并指定输出格式。");

  async function convert() {
    if (!file) return;
    setIsProcessing(true);
    setHasError(false);
    setMessage("上传并转换中…");
    try {
      const blob = await uploadForProcessing("markdown-export", file, { format });
      triggerDownload(blob, getDownloadFileName(file.name, "", format));
      setMessage(`转换完成（${formatFileSize(blob.size)}），下载应已开始。`);
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "转换失败，请重试。");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="Markdown 转 Word/PDF 工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-800"><FileText aria-hidden="true" className="size-6" /></span>
          <div><p className="text-sm font-medium text-sky-700">云端处理</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Markdown 导出</h2></div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">输出 .docx / .pdf · 用后即删</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择 Markdown 文件
          <input accept=".md,.markdown,text/markdown" className="sr-only" type="file" onChange={(event) => { const selected = event.target.files?.[0]; setFile(selected); setHasError(false); if (selected) setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}）。`); event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>}

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">输出格式</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["docx", "pdf"] as const).map((item) => (
              <button aria-pressed={format === item} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${format === item ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600"}`} key={item} onClick={() => setFormat(item)} type="button">
                {item === "docx" ? "Word (.docx)" : "PDF (.pdf)"}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void convert()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在转换" : `转换为 ${format === "docx" ? "Word" : "PDF"}`}
        </button>
        <p className="text-xs leading-5 text-slate-500">保留标题、列表、表格和代码块；为避免外部资源访问，Markdown 内嵌 HTML 会作为文字输出，远程图片只保留替代文字。</p>
      </div>
      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${hasError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
