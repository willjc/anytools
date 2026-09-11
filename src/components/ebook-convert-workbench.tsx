"use client";

import { useState } from "react";
import { BookOpen, Download, LoaderCircle } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize } from "@/lib/file-utils";
import {
  EBOOK_FORMAT_DESCRIPTIONS,
  EBOOK_FORMAT_LABELS,
  EBOOK_INPUT_FORMATS,
  EBOOK_OUTPUT_FORMATS,
  type EbookOutputFormat,
} from "@/lib/ebook-formats";

export function EbookConvertWorkbench() {
  const [file, setFile] = useState<File>();
  const [format, setFormat] = useState<EbookOutputFormat>("pdf");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("上传电子书或文档，选择目标格式，由服务器端 calibre 引擎转换。\n");

  const inputFormat = file?.name.split(".").pop()?.toLowerCase() ?? "";
  const outputOptions = EBOOK_OUTPUT_FORMATS.filter((item) => item !== inputFormat);

  async function convert() {
    if (!file) return;
    setIsProcessing(true);
    setMessage("上传并转换中，大文件需要一两分钟，请保持页面打开…");
    try {
      const blob = await uploadForProcessing("ebook-convert", file, { format });
      const outputName = `${file.name.replace(/\.[^.]+$/, "")}.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = outputName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(`转换完成：${outputName}（${formatFileSize(blob.size)}），下载应已开始。`);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "转换失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="电子书转换工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d9f3e1] text-emerald-800">
            <BookOpen aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">calibre 引擎 · 用后即删</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">电子书格式转换</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">EPUB / MOBI / AZW3 / PDF / Word</span>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            选择电子书或文档
            <input
              accept={EBOOK_INPUT_FORMATS.map((item) => `.${item}`).join(",")}
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                setFile(selected);
                if (selected) setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}），选择目标格式后开始转换。`);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          {file && <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}
        </div>

        <fieldset disabled={!file}>
          <legend className="text-sm font-semibold text-slate-900">转换为目标格式</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {outputOptions.map((item) => (
              <button
                aria-pressed={format === item}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${format === item ? "border-emerald-700 bg-emerald-50" : "border-slate-300 bg-white hover:border-emerald-500"}`}
                key={item}
                onClick={() => setFormat(item)}
                type="button"
              >
                <span className={`block text-sm font-semibold ${format === item ? "text-emerald-800" : "text-slate-900"}`}>{EBOOK_FORMAT_LABELS[item] ?? item.toUpperCase()}</span>
                {EBOOK_FORMAT_DESCRIPTIONS[item] && <span className="mt-0.5 block text-xs leading-4 text-slate-500">{EBOOK_FORMAT_DESCRIPTIONS[item]}</span>}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          disabled={!file || isProcessing}
          onClick={() => void convert()}
          type="button"
        >
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "转换中（可能需要一两分钟）" : "上传并转换"}
        </button>
        <p className="text-xs leading-5 text-slate-500">由服务器端 calibre 完成，文件处理完立即删除；PDF 输出为 A4 页面，扫描版 PDF 无法转为可编辑格式。</p>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
