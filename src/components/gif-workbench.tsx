"use client";

import { useState } from "react";
import { Download, LoaderCircle, Clapperboard } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize } from "@/lib/file-utils";
import { GIF_COMPRESS_LEVELS, GIF_FPS, GIF_WIDTHS, type GifCompressLevel, type GifFps, type GifWidth } from "@/lib/media-options";

const FPS_LABELS: Record<number, string> = { 10: "10 帧 · 最小", 15: "15 帧 · 推荐", 24: "24 帧 · 流畅" };
const WIDTH_LABELS: Record<number, string> = { 360: "360P 小巧", 480: "480P 推荐", 720: "720P 高清", 0: "原始宽度" };

export function GifWorkbench({ mode }: { mode: "convert" | "compress" }) {
  const [file, setFile] = useState<File>();
  const [fps, setFps] = useState<GifFps>(15);
  const [width, setWidth] = useState<GifWidth>(480);
  const [startMinutes, setStartMinutes] = useState("0");
  const [startSecondsInput, setStartSecondsInput] = useState("0");
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [level, setLevel] = useState<GifCompressLevel>("balanced");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(
    mode === "convert"
      ? "选择视频，设定起止与清晰度，由服务器转换为 GIF；单次最长 60 秒。\n"
      : "上传 GIF 选择压缩强度，服务器会重排色板与帧率来减小体积。\n",
  );

  async function run() {
    if (!file) return;

    const startTotal = (Number(startMinutes) || 0) * 60 + (Number(startSecondsInput) || 0);
    if (mode === "convert" && startTotal < 0) {
      setMessage("开始时间不能为负数。\n");
      return;
    }

    setIsProcessing(true);
    setMessage("上传并处理中，GIF 编码较慢，请耐心等待…");
    try {
      const fields: Record<string, string> =
        mode === "convert"
          ? {
              fps: String(fps),
              width: String(width),
              startSeconds: String(startTotal),
              durationSeconds: String(durationSeconds),
            }
          : { level };

      const slug = mode === "convert" ? "video-to-gif" : "gif-compress";
      const blob = await uploadForProcessing(slug, file, fields);
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(blob);
      anchor.download = mode === "convert" ? `${file.name.replace(/\.[^.]+$/, "")}.gif` : `${file.name.replace(/\.gif$/i, "")}-compressed.gif`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(anchor.href);
      setMessage(`完成：${formatFileSize(file.size)} → ${formatFileSize(blob.size)}，下载应已开始。`);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "处理失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  const isConvert = mode === "convert";

  return (
    <section aria-label={isConvert ? "视频转 GIF 工作区" : "GIF 压缩工作区"} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e6e0f5] text-violet-800">
            <Clapperboard aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理 · 用后即删</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{isConvert ? "视频转 GIF" : "GIF 压缩"}</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">调色板重编码 · 画质更好</span>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            {isConvert ? "选择视频文件" : "选择 GIF 文件"}
            <input
              accept={isConvert ? ".mp4,.mov,.mkv,.avi,.webm,video/*" : ".gif,image/gif"}
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                setFile(selected);
                if (selected) setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}）。`);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          {file && <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}
        </div>

        {isConvert ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-slate-900" htmlFor="gif-start-minutes">
                  开始 · 分
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  id="gif-start-minutes"
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => setStartMinutes(event.target.value.replace(/[^\d]/g, ""))}
                  type="number"
                  value={startMinutes}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900" htmlFor="gif-start-seconds">
                  开始 · 秒
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  id="gif-start-seconds"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  onChange={(event) => setStartSecondsInput(event.target.value.replace(/[^\d]/g, ""))}
                  type="number"
                  value={startSecondsInput}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900" htmlFor="gif-duration">
                  时长（秒，最长 60）
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  id="gif-duration"
                  inputMode="numeric"
                  max={60}
                  min={1}
                  onChange={(event) => setDurationSeconds(Math.min(60, Math.max(1, Number(event.target.value.replace(/[^\d]/g, "")) || 1)))}
                  type="number"
                  value={durationSeconds}
                />
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-900">帧率</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {GIF_FPS.map((value) => (
                  <button
                    aria-pressed={fps === value}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${fps === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`}
                    key={value}
                    onClick={() => setFps(value)}
                    type="button"
                  >
                    {FPS_LABELS[value]}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-900">宽度</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {GIF_WIDTHS.map((value) => (
                  <button
                    aria-pressed={width === value}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${width === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`}
                    key={value}
                    onClick={() => setWidth(value)}
                    type="button"
                  >
                    {WIDTH_LABELS[value]}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">压缩强度</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {GIF_COMPRESS_LEVELS.map((item) => (
                <button
                  aria-pressed={level === item.id}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${level === item.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`}
                  key={item.id}
                  onClick={() => setLevel(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!file || isProcessing}
          onClick={() => void run()}
          type="button"
        >
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          {isProcessing ? "处理中（GIF 编码较慢）" : isConvert ? "上传并转换为 GIF" : "上传并压缩"}
        </button>
        <p className="text-xs leading-5 text-slate-500">
          {isConvert
            ? "时长超过 60 秒请分段转换；生成结果超过 30MB 时请降低帧率或宽度。文件处理后立即删除。"
            : "压缩通过降低色数与帧率实现，追求画质请选「轻度」。文件处理后立即删除。"}
        </p>
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
