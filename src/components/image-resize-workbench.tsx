"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImageUp, LoaderCircle } from "lucide-react";

import { formatFileSize, getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import { loadImageFromFile } from "@/lib/image-bitmap";
import { calculateResizeDimensions, isResizeBatchTooLarge, type ResizeMode } from "@/lib/image-resize";

type ImageFormat = "image/jpeg" | "image/png" | "image/webp";
type ResizeResult = { blob: Blob; url: string; width: number; height: number; fileName: string };
type ResizeItem = { id: string; file: File; width: number; height: number; result?: ResizeResult };

const MAX_FILES = 12;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_SIDE = 8192;
const MAX_PIXELS = 32_000_000;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const FORMAT_OPTIONS: { value: ImageFormat; label: string; extension: string }[] = [
  { value: "image/webp", label: "WebP", extension: "webp" },
  { value: "image/jpeg", label: "JPEG", extension: "jpg" },
  { value: "image/png", label: "PNG", extension: "png" },
];

function disposeItems(items: ResizeItem[]) {
  items.forEach((item) => {
    if (item.result) URL.revokeObjectURL(item.result.url);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: ImageFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode-failed"))), type, type === "image/png" ? undefined : quality);
  });
}

export function ImageResizeWorkbench() {
  const [items, setItems] = useState<ResizeItem[]>([]);
  const [mode, setMode] = useState<ResizeMode>("width");
  const [targetWidth, setTargetWidth] = useState(1200);
  const [targetHeight, setTargetHeight] = useState(900);
  const [keepAspect, setKeepAspect] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(0.88);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(`最多选择 ${MAX_FILES} 张 JPG、PNG 或 WebP 图片。`);
  const [isError, setIsError] = useState(false);
  const itemsRef = useRef<ResizeItem[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      disposeItems(itemsRef.current);
    };
  }, []);

  function announce(nextMessage: string, error = false) {
    setMessage(nextMessage);
    setIsError(error);
  }

  function clearResults() {
    setItems((current) => {
      const next = current.map((item) => {
        if (!item.result) return item;
        URL.revokeObjectURL(item.result.url);
        return { ...item, result: undefined };
      });
      itemsRef.current = next;
      return next;
    });
  }

  async function selectFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    disposeItems(itemsRef.current);
    itemsRef.current = [];
    setItems([]);

    const selected = Array.from(fileList).slice(0, MAX_FILES);
    const loadedItems: ResizeItem[] = [];
    let skipped = Math.max(0, fileList.length - MAX_FILES);

    for (const [index, file] of selected.entries()) {
      const supported = ACCEPTED_TYPES.has(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!supported || file.size > MAX_FILE_SIZE) {
        skipped += 1;
        continue;
      }

      try {
        const loaded = await loadImageFromFile(file);
        if (!mountedRef.current) {
          URL.revokeObjectURL(loaded.element.src);
          break;
        }
        URL.revokeObjectURL(loaded.element.src);
        if (loaded.width > MAX_SIDE || loaded.height > MAX_SIDE || loaded.width * loaded.height > MAX_PIXELS) {
          skipped += 1;
          continue;
        }
        loadedItems.push({
          id: `${file.name}-${file.lastModified}-${index}`,
          file,
          width: loaded.width,
          height: loaded.height,
        });
      } catch {
        if (!mountedRef.current) break;
        skipped += 1;
      }
    }

    if (!mountedRef.current) {
      disposeItems(loadedItems);
      return;
    }
    itemsRef.current = loadedItems;
    setItems(loadedItems);
    setIsProcessing(false);
    if (loadedItems.length === 0) {
      announce(`没有可处理的图片。单张需不超过 20 MB、${MAX_SIDE}px 边长和 3200 万像素。`, true);
      return;
    }
    setTargetWidth(Math.min(loadedItems[0].width, 1200));
    setTargetHeight(Math.min(loadedItems[0].height, 900));
    announce(`已载入 ${loadedItems.length} 张图片${skipped ? `，跳过 ${skipped} 张不支持或超限文件` : ""}。`);
  }

  async function resizeAll() {
    if (items.length === 0) return;

    let plans: Array<{ width: number; height: number }>;
    try {
      plans = items.map((item) => calculateResizeDimensions({
        sourceWidth: item.width,
        sourceHeight: item.height,
        mode,
        targetWidth,
        targetHeight,
        keepAspect,
      }));
    } catch {
      announce("请输入有效的目标宽度和高度。", true);
      return;
    }

    const invalidIndex = plans.findIndex((size) => size.width > MAX_SIDE || size.height > MAX_SIDE || size.width * size.height > MAX_PIXELS);
    if (invalidIndex >= 0) {
      announce(`${items[invalidIndex].file.name} 的输出尺寸过大；单边最多 ${MAX_SIDE}px，且不超过 3200 万像素。`, true);
      return;
    }
    if (isResizeBatchTooLarge(plans)) {
      announce("全部图片的输出总像素不能超过 1 亿，请减小尺寸或减少图片数量。", true);
      return;
    }

    clearResults();
    setIsProcessing(true);
    announce("正在浏览器本地逐张缩放…");
    const outputFormat = FORMAT_OPTIONS.find((option) => option.value === format)!;
    const results = new Map<string, ResizeResult>();
    let failed = 0;

    for (const [index, item] of items.entries()) {
      if (!mountedRef.current) break;
      let loaded: Awaited<ReturnType<typeof loadImageFromFile>> | undefined;
      try {
        loaded = await loadImageFromFile(item.file);
        const size = plans[index];
        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("no-canvas");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (format === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(loaded.element, 0, 0, canvas.width, canvas.height);
        const blob = await canvasToBlob(canvas, format, quality);
        if (!mountedRef.current) break;
        results.set(item.id, {
          blob,
          url: URL.createObjectURL(blob),
          width: size.width,
          height: size.height,
          fileName: getDownloadFileName(item.file.name, `-${size.width}x${size.height}`, outputFormat.extension),
        });
        canvas.width = 1;
        canvas.height = 1;
      } catch {
        failed += 1;
      } finally {
        if (loaded) URL.revokeObjectURL(loaded.element.src);
      }
    }

    if (!mountedRef.current) {
      results.forEach((result) => URL.revokeObjectURL(result.url));
      return;
    }
    const nextItems = items.map((item) => ({ ...item, result: results.get(item.id) }));
    itemsRef.current = nextItems;
    setItems(nextItems);
    setIsProcessing(false);
    const succeeded = results.size;
    announce(`已生成 ${succeeded} 张图片${failed ? `，${failed} 张失败` : ""}。可逐张预览下载或一键下载全部。`, succeeded === 0);
  }

  function downloadAll() {
    const results = items.flatMap((item) => item.result ? [item.result] : []);
    results.forEach((result, index) => window.setTimeout(() => triggerDownload(result.blob, result.fileName), index * 180));
    announce("正在逐张下载；若浏览器询问，请允许下载多个文件。");
  }

  const hasValidTarget = mode === "width" ? targetWidth >= 1 : mode === "height" ? targetHeight >= 1 : targetWidth >= 1 && targetHeight >= 1;
  const resultCount = items.filter((item) => item.result).length;

  return (
    <section aria-label="批量图片缩放工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ImageUp aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">批量图片缩放</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">最多 {MAX_FILES} 张 · 原图不上传</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="space-y-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
            <ImageUp aria-hidden="true" className="size-4" /> 选择多张图片
            <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" disabled={isProcessing} multiple onChange={(event) => { void selectFiles(event.target.files); event.target.value = ""; }} type="file" />
          </label>
          <p className="text-xs leading-5 text-slate-500">支持 JPG、PNG、WebP；单张不超过 20 MB、{MAX_SIDE}px 边长和 3200 万像素，输出合计不超过 1 亿像素。</p>

          {items.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                return (
                  <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white" key={item.id}>
                    {item.result ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={`${item.file.name} 缩放结果预览`} className="h-36 w-full bg-slate-50 object-contain" src={item.result.url} />
                    ) : (
                      <div className="grid h-36 place-items-center bg-slate-50 text-slate-400"><ImageUp aria-hidden="true" className="size-7" /></div>
                    )}
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">{item.file.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.result ? `${item.result.width}×${item.result.height} · ${formatFileSize(item.result.blob.size)}` : `${item.width}×${item.height} · ${formatFileSize(item.file.size)}`}</p>
                      </div>
                      {item.result && (
                        <button aria-label={`下载 ${item.file.name} 的缩放结果`} className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 text-slate-600 transition hover:border-emerald-600 hover:text-emerald-700" onClick={() => triggerDownload(item.result!.blob, item.result!.fileName)} type="button"><Download aria-hidden="true" className="size-4" /></button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="h-fit space-y-5 rounded-2xl bg-slate-50 p-5">
          <label className="block text-sm font-semibold text-slate-900" htmlFor="resize-mode">尺寸方式</label>
          <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isProcessing} id="resize-mode" onChange={(event) => { clearResults(); setMode(event.target.value as ResizeMode); }} value={mode}>
            <option value="width">按宽度等比</option>
            <option value="height">按高度等比</option>
            <option value="exact">精确尺寸</option>
          </select>

          <div className="grid gap-3 sm:grid-cols-2">
            {mode !== "height" && (
              <label className="text-sm font-semibold text-slate-900" htmlFor="resize-width">目标宽度
                <input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isProcessing} id="resize-width" max={MAX_SIDE} min="1" onChange={(event) => { clearResults(); setTargetWidth(Number(event.target.value)); }} type="number" value={targetWidth} />
              </label>
            )}
            {mode !== "width" && (
              <label className="text-sm font-semibold text-slate-900" htmlFor="resize-height">目标高度
                <input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isProcessing} id="resize-height" max={MAX_SIDE} min="1" onChange={(event) => { clearResults(); setTargetHeight(Number(event.target.value)); }} type="number" value={targetHeight} />
              </label>
            )}
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700">
            <input checked={mode !== "exact" || keepAspect} className="size-4 accent-emerald-700" disabled={isProcessing || mode !== "exact"} onChange={(event) => { clearResults(); setKeepAspect(event.target.checked); }} type="checkbox" />
            保持原图比例{mode !== "exact" ? "（按单边缩放时固定开启）" : ""}
          </label>

          <label className="block text-sm font-semibold text-slate-900" htmlFor="resize-format">输出格式</label>
          <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isProcessing} id="resize-format" onChange={(event) => { clearResults(); setFormat(event.target.value as ImageFormat); }} value={format}>
            {FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>

          <label className="block text-sm font-semibold text-slate-900" htmlFor="resize-quality">画质 <span className="font-medium text-slate-500">{Math.round(quality * 100)}%</span></label>
          <input className="w-full accent-emerald-700" disabled={isProcessing || format === "image/png"} id="resize-quality" max="1" min="0.4" onChange={(event) => { clearResults(); setQuality(Number(event.target.value)); }} step="0.01" type="range" value={quality} />
          <p className="text-xs leading-5 text-slate-500">{format === "image/png" ? "PNG 无损导出，不使用画质设置。" : "画质越高，通常文件越大。JPEG 透明区域会填充为白色。"}</p>

          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={items.length === 0 || !hasValidTarget || isProcessing} onClick={() => void resizeAll()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <ImageUp aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在处理" : items.length ? `缩放 ${items.length} 张图片` : "缩放图片"}
          </button>
          {resultCount > 0 && (
            <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700" onClick={downloadAll} type="button"><Download aria-hidden="true" className="size-4" />一键下载全部（{resultCount}）</button>
          )}
        </div>
      </div>

      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
