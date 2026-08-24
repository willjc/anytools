"use client";

import { useState } from "react";
import { ArrowLeftRight, Download, LoaderCircle } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { AUDIO_TARGETS } from "@/lib/media-options";

const BITRATES = [96, 128, 192, 320] as const;

export function AudioConvertWorkbench() {
  const [file, setFile] = useState<File>();
  const [format, setFormat] = useState<(typeof AUDIO_TARGETS)[number]["format"]>("mp3");
  const [bitrateKbps, setBitrateKbps] = useState(192);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择音频文件，选择目标格式后上传转换。\n");

  async function convert() {
    if (!file) return;

    setIsProcessing(true);
    setMessage("上传并转换中…");
    try {
      const blob = await uploadForProcessing("audio-convert", file, { format, bitrateKbps: String(bitrateKbps) });
      triggerDownload(blob, getDownloadFileName(file.name, "-converted", format));
      setMessage(`转换完成（${formatFileSize(blob.size)}），下载应已开始。`);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "转换失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="音频格式转换工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ArrowLeftRight aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">音频格式转换</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">用后即删</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择音频文件
          <input accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,audio/*" className="sr-only" type="file" onChange={(event) => { const selected = event.target.files?.[0]; setFile(selected); if (selected) setMessage(`已选择 ${formatFileSize(selected.size)} 的音频。`); event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}

        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">目标格式</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {AUDIO_TARGETS.map((target) => (
              <button className={`rounded-full border px-4 py-2 text-xs font-medium transition ${format === target.format ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`} key={target.format} onClick={() => setFormat(target.format)} type="button">{target.label}</button>
            ))}
          </div>
        </fieldset>

        {(format === "mp3" || format === "m4a") && (
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">比特率</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {BITRATES.map((value) => (
                <button className={`rounded-full border px-4 py-2 text-xs font-medium transition ${bitrateKbps === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`} key={value} onClick={() => setBitrateKbps(value)} type="button">{value} kbps{value === 192 ? "（推荐）" : ""}</button>
              ))}
            </div>
          </fieldset>
        )}
        {(format === "wav" || format === "flac") && <p className="text-xs leading-5 text-slate-500">{format === "wav" ? "WAV 为无损原始采样，体积较大。" : "FLAC 为无损压缩，音质与 WAV 相同、体积更小。"}</p>}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void convert()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在转换" : "上传并转换"}
        </button>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
