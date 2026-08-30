"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, Download, LoaderCircle, X } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize } from "@/lib/file-utils";

type QueuedPhoto = {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "failed";
  resultSize?: number;
};

export function HeicToJpgWorkbench() {
  const [photos, setPhotos] = useState<QueuedPhoto[]>([]);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("选择一张或多张 HEIC 照片，逐张上传转换并自动下载。\n");

  function addFiles(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const queued: QueuedPhoto[] = Array.from(selectedFiles)
      .filter((file) => /\.(heic|heif)$/i.test(file.name))
      .map((file) => ({ id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`, file, status: "pending" }));

    if (queued.length === 0) {
      setMessage("没有识别到 .heic/.heif 文件。\n");
      return;
    }
    setPhotos((current) => [...current, ...queued]);
    setMessage(`已加入 ${queued.length} 张照片。`);
  }

  async function convertQueue() {
    const pending = photos.filter((photo) => photo.status === "pending" || photo.status === "failed");
    if (pending.length === 0) return;

    setIsRunning(true);
    let succeeded = 0;
    for (const photo of pending) {
      setPhotos((current) => current.map((entry) => (entry.id === photo.id ? { ...entry, status: "processing" } : entry)));
      try {
        const blob = await uploadForProcessing("heic-to-jpg", photo.file, { format });
        const anchor = document.createElement("a");
        anchor.href = URL.createObjectURL(blob);
        anchor.download = `${photo.file.name.replace(/\.(heic|heif)$/i, "")}.${format}`;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
        setPhotos((current) => current.map((entry) => (entry.id === photo.id ? { ...entry, status: "done", resultSize: blob.size } : entry)));
        succeeded += 1;
      } catch (error) {
        setPhotos((current) => current.map((entry) => (entry.id === photo.id ? { ...entry, status: "failed" } : entry)));
        setMessage(error instanceof Error ? `${error.message}\n` : "转换失败，请重试。\n");
      }
    }
    setIsRunning(false);
    setMessage(`本轮处理完成：成功 ${succeeded} / ${pending.length} 张。`);
  }

  return (
    <section aria-label="HEIC 转 JPG 工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ArrowLeftRight aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">HEIC 转 JPG</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">iPhone 照片通用格式 · 用后即删</span>
      </div>

      <div className="mt-7 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            添加 HEIC/HEIF 照片
            <input accept=".heic,.heif,image/heic,image/heif" className="sr-only" multiple type="file" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
          </label>
          <div className="flex gap-2">
            {[["jpg", "转 JPG（推荐）"], ["png", "转 PNG"]].map(([value, label]) => (
              <button className={`rounded-full border px-4 py-2 text-xs font-medium transition ${format === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`} key={value} onClick={() => setFormat(value as "jpg" | "png")} type="button">{label}</button>
            ))}
          </div>
        </div>

        {photos.length > 0 && (
          <ul className="space-y-2">
            {photos.map((photo, index) => (
              <li className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" key={photo.id}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{photo.file.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{formatFileSize(photo.file.size)}</span>
                {photo.status === "done" && <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700"><Check aria-hidden="true" className="size-3.5" />完成{photo.resultSize ? ` · ${formatFileSize(photo.resultSize)}` : ""}</span>}
                {photo.status === "failed" && <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-red-600"><X aria-hidden="true" className="size-3.5" />失败</span>}
                {photo.status === "processing" && <LoaderCircle aria-hidden="true" className="size-3.5 shrink-0 animate-spin text-slate-400" />}
                <button aria-label="移除" className="shrink-0 text-slate-400 transition hover:text-red-600" onClick={() => setPhotos((current) => current.filter((entry) => entry.id !== photo.id))} type="button"><X aria-hidden="true" className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={photos.length === 0 || isRunning} onClick={() => void convertQueue()} type="button">
          {isRunning ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isRunning ? "正在逐张转换" : `开始转换为 ${format.toUpperCase()}`}
        </button>
        <p className="text-xs leading-5 text-slate-500">由服务器端的 libheif 完成解码，解决电脑打不开 iPhone 照片的问题；照片转换后立即删除。</p>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
