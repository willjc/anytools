"use client";

import { useState } from "react";
import { Download, LoaderCircle, Video } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { VIDEO_HEIGHTS } from "@/lib/media-options";

const HEIGHT_LABELS: Record<number, string> = {
  1080: "1080P 高清",
  720: "720P 高清（推荐）",
  480: "480P 流畅",
  360: "360P 尽量小",
};

export function VideoCompressWorkbench() {
  const [file, setFile] = useState<File>();
  const [height, setHeight] = useState(720);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择视频并选择清晰度，上传后由服务器压缩为 MP4。\n");

  async function compress() {
    if (!file) return;

    setIsProcessing(true);
    setMessage("上传中，视频较大时请耐心等待…");
    try {
      const blob = await uploadForProcessing("video-compress", file, { height: String(height) });
      triggerDownload(blob, getDownloadFileName(file.name.replace(/\.[^.]+$/, ".mp4"), "-compressed", "mp4"));
      setMessage(`压缩完成：${formatFileSize(file.size)} → ${formatFileSize(blob.size)}，下载应已开始。`);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "压缩失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="视频压缩工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Video aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">视频压缩</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">输出通用 MP4 · 用后即删</span>
      </div>

      <div className="mt-7 space-y-5">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
          选择视频文件
          <input accept=".mp4,.mov,.mkv,.avi,.webm,video/*" className="sr-only" type="file" onChange={(event) => { const selected = event.target.files?.[0]; setFile(selected); if (selected) setMessage(`已选择 ${formatFileSize(selected.size)} 的视频。`); event.target.value = ""; }} />
        </label>
        {file && <p className="truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}

        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">目标清晰度</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {VIDEO_HEIGHTS.map((value) => (
              <button className={`rounded-full border px-4 py-2 text-xs font-medium transition ${height === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`} key={value} onClick={() => setHeight(value)} type="button">{HEIGHT_LABELS[value]}</button>
            ))}
          </div>
        </fieldset>

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!file || isProcessing} onClick={() => void compress()} type="button">
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "正在压缩（可能需要几分钟）" : "上传并压缩"}
        </button>
        <p className="text-xs leading-5 text-slate-500">视频处理在服务器完成，转换后立即删除；大文件耗时更久，请不要关闭页面。</p>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
