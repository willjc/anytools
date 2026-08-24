"use client";

import { useState } from "react";
import { Download, LoaderCircle, Music } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";

export function VideoToAudioWorkbench() {
  const [file, setFile] = useState<File>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择视频文件，服务器会取出其中的音轨并转为 MP3。\n");

  async function extract() {
    if (!file) return;

    setIsProcessing(true);
    setMessage("上传并提取音频中…");
    try {
      const blob = await uploadForProcessing("video-to-audio", file);
      triggerDownload(blob, getDownloadFileName(file.name, "-audio", "mp3"));
      setMessage(`提取完成（${formatFileSize(blob.size)}），下载应已开始。`);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "提取失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="视频提取音频工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Music aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">视频提取音频</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">输出 MP3 · 用后即删</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择视频文件
          <input accept=".mp4,.mov,.mkv,.webm,.avi,.m4v,video/*" className="sr-only" type="file" onChange={(event) => { const selected = event.target.files?.[0]; setFile(selected); if (selected) setMessage(`已选择 ${formatFileSize(selected.size)} 的视频。`); event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void extract()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在提取" : "上传并提取 MP3"}
        </button>
        <p className="text-xs leading-5 text-slate-500">只保留音轨，画质信息全部丢弃；适合课程、访谈与演出片段。</p>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
