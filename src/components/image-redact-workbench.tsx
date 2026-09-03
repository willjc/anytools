"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eraser, ImageUp, LoaderCircle, RotateCcw, Undo2 } from "lucide-react";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { loadImageFromFile } from "@/lib/image-bitmap";
import { clientPointToImagePoint, createRedactionRect, percentageRectToImageRect, type ImagePoint, type RedactionRect } from "@/lib/image-redact";

type LoadedPhoto = { file: File; element: HTMLImageElement; width: number; height: number };

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_SIDE = 8192;
const MAX_PIXELS = 32_000_000;
const PREVIEW_WIDTH = 1400;
const PREVIEW_HEIGHT = 900;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ImageRedactWorkbench() {
  const [photo, setPhoto] = useState<LoadedPhoto>();
  const [redactions, setRedactions] = useState<RedactionRect[]>([]);
  const [manualRect, setManualRect] = useState<RedactionRect>({ x: 10, y: 10, width: 40, height: 10 });
  const [draft, setDraft] = useState<RedactionRect>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("选择一张图片，在图上拖动框选要遮挡的区域。原图仅在本机浏览器中处理。");
  const [isError, setIsError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<LoadedPhoto | undefined>(undefined);
  const dragRef = useRef<{ pointerId: number; start: ImagePoint } | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    photoRef.current = photo;
  }, [photo]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.element.src);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;
    const scale = Math.min(PREVIEW_WIDTH / photo.width, PREVIEW_HEIGHT / photo.height, 1);
    canvas.width = Math.max(1, Math.round(photo.width * scale));
    canvas.height = Math.max(1, Math.round(photo.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(photo.element, 0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000000";
    for (const rect of draft ? [...redactions, draft] : redactions) {
      context.fillRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale);
    }
  }, [photo, redactions, draft]);

  function announce(nextMessage: string, error = false) {
    setMessage(nextMessage);
    setIsError(error);
  }

  async function selectFile(file: File | undefined) {
    if (!file) return;
    const supported = ACCEPTED_TYPES.has(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!supported || file.size > MAX_FILE_SIZE) {
      announce("请选择不超过 20 MB 的 JPG、PNG 或 WebP 图片。", true);
      return;
    }

    setIsProcessing(true);
    try {
      const loaded = await loadImageFromFile(file);
      if (!mountedRef.current) {
        URL.revokeObjectURL(loaded.element.src);
        return;
      }
      if (loaded.width > MAX_SIDE || loaded.height > MAX_SIDE || loaded.width * loaded.height > MAX_PIXELS) {
        URL.revokeObjectURL(loaded.element.src);
        announce(`图片过大；单边最多 ${MAX_SIDE}px，且不超过 3200 万像素。`, true);
        return;
      }
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.element.src);
      const nextPhoto = { file, element: loaded.element, width: loaded.width, height: loaded.height };
      photoRef.current = nextPhoto;
      setPhoto(nextPhoto);
      setRedactions([]);
      setDraft(undefined);
      dragRef.current = undefined;
      announce(`已载入 ${loaded.width}×${loaded.height} 图片。拖动框选后再导出 PNG。`);
    } catch {
      if (mountedRef.current) announce("无法读取这张图片，请换一张 JPG、PNG 或 WebP 图片。", true);
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }

  function imagePoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const current = photoRef.current;
    if (!current) throw new Error("no-photo");
    return clientPointToImagePoint({
      clientX: event.clientX,
      clientY: event.clientY,
      bounds: event.currentTarget.getBoundingClientRect(),
      imageWidth: current.width,
      imageHeight: current.height,
    });
  }

  function startRedaction(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!photo || isProcessing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = imagePoint(event);
    dragRef.current = { pointerId: event.pointerId, start };
    setDraft(createRedactionRect(start, start));
  }

  function moveRedaction(event: React.PointerEvent<HTMLCanvasElement>) {
    if (isProcessing) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    setDraft(createRedactionRect(drag.start, imagePoint(event)));
  }

  function finishRedaction(event: React.PointerEvent<HTMLCanvasElement>, commit: boolean) {
    if (isProcessing) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const rect = createRedactionRect(drag.start, imagePoint(event));
    dragRef.current = undefined;
    setDraft(undefined);
    if (!commit) return;
    if (rect.width < 2 || rect.height < 2) {
      announce("遮挡框太小，请重新拖动框选。", true);
      return;
    }
    setRedactions((current) => [...current, rect]);
    announce(`已添加第 ${redactions.length + 1} 处实心遮挡。`);
  }

  function undo() {
    if (redactions.length === 0) return;
    setRedactions(redactions.slice(0, -1));
    announce(`已撤销上一步，当前还有 ${redactions.length - 1} 处遮挡。`);
  }

  function addManualRedaction() {
    if (!photo) return;
    try {
      const rect = percentageRectToImageRect(manualRect, photo.width, photo.height);
      setRedactions((current) => [...current, rect]);
      announce(`已通过键盘参数添加第 ${redactions.length + 1} 处实心遮挡。`);
    } catch {
      announce("请输入有效的百分比位置和尺寸。", true);
    }
  }

  function reset() {
    setRedactions([]);
    setDraft(undefined);
    dragRef.current = undefined;
    announce("已重置遮挡区域，原图仍保留在本机浏览器中。");
  }

  async function exportRedacted() {
    if (!photo || redactions.length === 0) return;
    setIsProcessing(true);
    announce("正在浏览器本地写入实心遮挡…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = photo.width;
      canvas.height = photo.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no-canvas");
      context.drawImage(photo.element, 0, 0);
      context.fillStyle = "#000000";
      redactions.forEach((rect) => context.fillRect(rect.x, rect.y, rect.width, rect.height));
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("encode-failed");
      if (!mountedRef.current) return;
      triggerDownload(blob, getDownloadFileName(photo.file.name, "-redacted", "png"));
      canvas.width = 1;
      canvas.height = 1;
      announce(`已导出包含 ${redactions.length} 处遮挡的 PNG；遮挡已写入像素，无法从导出图片还原。`);
    } catch {
      if (mountedRef.current) announce("导出失败，请减少图片尺寸后重试。", true);
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }

  return (
    <section aria-label="图片实心遮挡工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Eraser aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">图片实心遮挡</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">原图仅本地 · 不会上传</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.55fr]">
        <div>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
            <ImageUp aria-hidden="true" className="size-4" /> 选择一张图片
            <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" disabled={isProcessing} onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = ""; }} type="file" />
          </label>

          {photo ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <canvas
                aria-describedby="redact-instructions"
                aria-label="图片遮挡编辑区"
                className={`block h-auto w-full select-none ${isProcessing ? "pointer-events-none cursor-wait" : "touch-none cursor-crosshair"}`}
                onPointerCancel={(event) => finishRedaction(event, false)}
                onPointerDown={startRedaction}
                onPointerMove={moveRedaction}
                onPointerUp={(event) => finishRedaction(event, true)}
                ref={canvasRef}
                role="img"
              />
            </div>
          ) : (
            <div className="mt-4 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">选择图片后，拖动鼠标或手指框选敏感区域。</div>
          )}
        </div>

        <div className="h-fit space-y-4 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">操作</p>
          <p className="text-xs leading-5 text-slate-500" id="redact-instructions">在图片上按住并拖动，可添加多个纯黑遮挡框。导出后遮挡会永久写入 PNG 像素。</p>
          <details className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">用键盘输入遮挡区域</summary>
            <p className="mb-3 text-xs leading-5 text-slate-500">以下数值均为相对原图左上角的百分比。</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["左侧位置", "x"],
                ["顶部位置", "y"],
                ["宽度", "width"],
                ["高度", "height"],
              ] as const).map(([label, key]) => (
                <label className="text-xs font-medium" key={key}>{label}
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2.5 text-sm" disabled={!photo || isProcessing} max={key === "x" || key === "y" ? 99 : 100} min={key === "x" || key === "y" ? 0 : 1} onChange={(event) => setManualRect((current) => ({ ...current, [key]: Number(event.target.value) }))} type="number" value={manualRect[key]} />
                </label>
              ))}
            </div>
            <button className="mt-3 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-40" disabled={!photo || isProcessing} onClick={addManualRedaction} type="button">添加这处遮挡</button>
          </details>
          <div className="grid grid-cols-2 gap-3">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400" disabled={redactions.length === 0 || isProcessing} onClick={undo} type="button"><Undo2 aria-hidden="true" className="size-4" />撤销上一步</button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400" disabled={redactions.length === 0 || isProcessing} onClick={reset} type="button"><RotateCcw aria-hidden="true" className="size-4" />重置</button>
          </div>
          <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">当前 {redactions.length} 处遮挡</p>
          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!photo || redactions.length === 0 || isProcessing} onClick={() => void exportRedacted()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在导出" : "导出不可还原的 PNG"}
          </button>
          <p className="text-xs leading-5 text-slate-500">限制：单张不超过 20 MB、{MAX_SIDE}px 边长和 3200 万像素。请保留原图作为备份。</p>
        </div>
      </div>

      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
