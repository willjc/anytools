"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ImagePlus, LoaderCircle, Move, Stamp } from "lucide-react";
import { PDFDocument } from "pdf-lib";

import { getDownloadFileName, triggerDownload } from "@/lib/file-utils";
import {
  addSignatureImageToPdf,
  clampSignaturePlacement,
  supportsSimpleSignaturePlacement,
  type SignatureImageKind,
  type SignaturePlacement,
} from "@/lib/pdf-signature";
import { renderPdfPageToCanvas } from "@/lib/pdf-render";

type PageSize = { width: number; height: number; supported: boolean };

const DEFAULT_PLACEMENT: SignaturePlacement = {
  xRatio: 0.35,
  yRatio: 0.45,
  widthRatio: 0.3,
};
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_SIDE = 8192;
const MAX_IMAGE_PIXELS = 32_000_000;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取签名图片。"));
    image.src = url;
  });
}

function normalizeJpeg(image: HTMLImageElement): Promise<ArrayBuffer> {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("无法创建图片画布。"));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error("无法处理签名图片。"));
      return;
    }
    blob.arrayBuffer().then(resolve, reject).finally(() => {
      canvas.width = 1;
      canvas.height = 1;
    });
  }, "image/jpeg", 0.95));
}

export function PdfSignatureWorkbench() {
  const [pdfFile, setPdfFile] = useState<File>();
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer>();
  const [pageSizes, setPageSizes] = useState<PageSize[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [renderedPageIndex, setRenderedPageIndex] = useState<number>();
  const [signatureName, setSignatureName] = useState("");
  const [signatureBytes, setSignatureBytes] = useState<ArrayBuffer>();
  const [signatureKind, setSignatureKind] = useState<SignatureImageKind>();
  const [signatureAspect, setSignatureAspect] = useState(1);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [placement, setPlacement] = useState<SignaturePlacement>(DEFAULT_PLACEMENT);
  const [isRendering, setIsRendering] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("先选择 PDF 和签名或印章图片，再在页面预览中拖动定位。\n");
  const [hasError, setHasError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | undefined>(undefined);
  const fileLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  const pageSize = pageSizes[pageIndex];
  const pageSupported = pageSize?.supported ?? false;
  const signatureHeightRatio = pageSize
    ? (placement.widthRatio * pageSize.width) / signatureAspect / pageSize.height
    : 0;

  useEffect(() => {
    return () => {
      if (signatureUrl) URL.revokeObjectURL(signatureUrl);
    };
  }, [signatureUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  function showMessage(text: string, error = false) {
    setMessage(text);
    setHasError(error);
  }

  function centeredPlacement(size: PageSize, aspect: number): SignaturePlacement {
    const centered = { ...DEFAULT_PLACEMENT };
    const clamped = clampSignaturePlacement(centered, size, aspect);
    const heightRatio = (clamped.widthRatio * size.width) / aspect / size.height;
    return { ...clamped, xRatio: (1 - clamped.widthRatio) / 2, yRatio: (1 - heightRatio) / 2 };
  }

  async function renderPage(bytes: ArrayBuffer, targetPageIndex: number): Promise<boolean> {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    setIsRendering(true);
    setRenderedPageIndex(undefined);
    try {
      await renderPdfPageToCanvas(bytes, targetPageIndex + 1, canvas);
      if (!mountedRef.current) return false;
      setRenderedPageIndex(targetPageIndex);
      return true;
    } catch {
      if (mountedRef.current) showMessage("无法渲染这一页，请换一个 PDF 文件重试。\n", true);
      return false;
    } finally {
      if (mountedRef.current) setIsRendering(false);
    }
  }

  async function selectPdf(selectedFile: File | undefined) {
    if (!selectedFile || fileLoadingRef.current) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      showMessage("请选择 PDF 文件。\n", true);
      return;
    }
    if (selectedFile.size > MAX_PDF_BYTES) {
      showMessage("PDF 文件不能超过 50 MB。\n", true);
      return;
    }

    fileLoadingRef.current = true;
    setIsLoadingFile(true);
    try {
      const bytes = await selectedFile.arrayBuffer();
      const document = await PDFDocument.load(bytes.slice(0));
      const sizes = document.getPages().map((page) => ({ ...page.getSize(), supported: supportsSimpleSignaturePlacement(page) }));
      if (sizes.length === 0) throw new Error("empty-pdf");
      if (!mountedRef.current) return;

      setPdfFile(selectedFile);
      setPdfBytes(bytes);
      setPageSizes(sizes);
      setPageIndex(0);
      setPlacement(centeredPlacement(sizes[0], signatureAspect));
      showMessage(`已读取 ${sizes.length} 页，正在渲染第 1 页…`);
      if (await renderPage(bytes, 0)) {
        showMessage(sizes[0].supported
          ? `已读取 ${sizes.length} 页，请选择签名图片并拖动定位。`
          : "当前页使用了旋转或裁切页面边界，为避免盖错位置，本工具不处理这一页。", !sizes[0].supported);
      }
    } catch {
      if (!mountedRef.current) return;
      setPdfFile(undefined);
      setPdfBytes(undefined);
      setPageSizes([]);
      setRenderedPageIndex(undefined);
      showMessage("无法读取此 PDF，文件可能已损坏或加密。\n", true);
    } finally {
      fileLoadingRef.current = false;
      if (mountedRef.current) setIsLoadingFile(false);
    }
  }

  async function selectSignature(selectedFile: File | undefined) {
    if (!selectedFile || fileLoadingRef.current) return;
    const lowerName = selectedFile.name.toLowerCase();
    const kind: SignatureImageKind | undefined =
      selectedFile.type === "image/png" || lowerName.endsWith(".png")
        ? "png"
        : selectedFile.type === "image/jpeg" || /\.jpe?g$/.test(lowerName)
          ? "jpg"
          : undefined;
    if (!kind) {
      showMessage("签名或印章图片仅支持 PNG、JPG、JPEG。\n", true);
      return;
    }
    if (selectedFile.size > MAX_IMAGE_BYTES) {
      showMessage("签名或印章图片不能超过 20 MB。\n", true);
      return;
    }

    fileLoadingRef.current = true;
    setIsLoadingFile(true);
    const url = URL.createObjectURL(selectedFile);
    try {
      const image = await loadImage(url);
      const { naturalWidth: width, naturalHeight: height } = image;
      if (width <= 0 || height <= 0) throw new Error("empty-image");
      if (width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width * height > MAX_IMAGE_PIXELS) {
        throw new Error("image-too-large");
      }
      const bytes = kind === "jpg" ? await normalizeJpeg(image) : await selectedFile.arrayBuffer();
      if (!mountedRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      const aspect = width / height;

      setSignatureName(selectedFile.name);
      setSignatureBytes(bytes);
      setSignatureKind(kind);
      setSignatureAspect(aspect);
      setSignatureUrl(url);
      if (pageSize) setPlacement(centeredPlacement(pageSize, aspect));
      showMessage(pageSize && !pageSupported
        ? "签名图片已载入，但当前页使用了旋转或裁切页面边界，不能安全定位。"
        : "签名图片已载入，可在 PDF 预览上拖动位置并调整大小。", Boolean(pageSize && !pageSupported));
    } catch {
      URL.revokeObjectURL(url);
      if (mountedRef.current) showMessage("无法读取这张签名图片；单边最多 8192px，且不超过 3200 万像素。\n", true);
    } finally {
      fileLoadingRef.current = false;
      if (mountedRef.current) setIsLoadingFile(false);
    }
  }

  async function goToPage(targetPageIndex: number) {
    if (!pdfBytes || fileLoadingRef.current || isProcessing || targetPageIndex < 0 || targetPageIndex >= pageSizes.length || targetPageIndex === pageIndex) return;
    setPageIndex(targetPageIndex);
    if (signatureKind) setPlacement(centeredPlacement(pageSizes[targetPageIndex], signatureAspect));
    showMessage(`正在渲染第 ${targetPageIndex + 1} 页…`);
    if (await renderPage(pdfBytes, targetPageIndex)) {
      showMessage(pageSizes[targetPageIndex].supported
        ? `已切换到第 ${targetPageIndex + 1} 页，请拖动签名图片定位。`
        : "这一页使用了旋转或裁切页面边界，为避免盖错位置，本工具不处理这一页。", !pageSizes[targetPageIndex].supported);
    }
  }

  function updatePlacement(next: SignaturePlacement) {
    if (!pageSize || isProcessing) return;
    setPlacement(clampSignaturePlacement(next, pageSize, signatureAspect));
  }

  function beginDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (isProcessing) return;
    const preview = previewRef.current;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: (event.clientX - rect.left) / rect.width - placement.xRatio,
      offsetY: (event.clientY - rect.top) / rect.height - placement.yRatio,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function drag(event: React.PointerEvent<HTMLButtonElement>) {
    const preview = previewRef.current;
    const activeDrag = dragRef.current;
    if (!preview || !activeDrag || activeDrag.pointerId !== event.pointerId) return;
    const rect = preview.getBoundingClientRect();
    updatePlacement({
      ...placement,
      xRatio: (event.clientX - rect.left) / rect.width - activeDrag.offsetX,
      yRatio: (event.clientY - rect.top) / rect.height - activeDrag.offsetY,
    });
  }

  function endDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function moveWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 0.05 : 0.01;
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    updatePlacement({ ...placement, xRatio: placement.xRatio + offset[0], yRatio: placement.yRatio + offset[1] });
  }

  async function exportPdf() {
    if (!pdfFile || !pdfBytes || !signatureBytes || !signatureKind || !pageSupported) return;
    setIsProcessing(true);
    showMessage("正在浏览器本地插入签名图片…");
    try {
      const output = await addSignatureImageToPdf(pdfBytes, signatureBytes, signatureKind, { pageIndex, ...placement });
      if (!mountedRef.current) return;
      triggerDownload(
        new Blob([Uint8Array.from(output)], { type: "application/pdf" }),
        getDownloadFileName(pdfFile.name, "-with-signature", "pdf"),
      );
      showMessage("签名图片已插入，下载应已开始。原始文件未上传。");
    } catch (error) {
      if (mountedRef.current) showMessage(error instanceof Error ? error.message : "插入签名图片失败，请重试。\n", true);
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }

  return (
    <section aria-label="PDF 签名图片工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Stamp aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">插入签名或印章图片</h2>
          </div>
        </div>
        {pageSizes.length > 0 && <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">共 {pageSizes.length} 页</span>}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.62fr]">
        <div>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
            选择 PDF 文件（最大 50 MB）
            <input accept=".pdf,application/pdf" className="sr-only" disabled={isLoadingFile || isRendering || isProcessing} type="file" onChange={(event) => { void selectPdf(event.target.files?.[0]); event.target.value = ""; }} />
          </label>
          {pdfFile && <p className="mt-3 truncate text-sm font-medium text-slate-900">{pdfFile.name}</p>}

          <div ref={previewRef} className={`relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${pdfFile ? "" : "grid min-h-72 place-items-center"}`}>
            {!pdfFile && <p className="px-5 text-center text-sm leading-6 text-slate-500">选择 PDF 后将在这里显示目标页面。</p>}
            <canvas className={pdfFile ? "block h-auto w-full select-none" : "hidden"} ref={canvasRef} />
            {isRendering && <div className="absolute inset-0 grid place-items-center bg-white/80 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="mr-2 inline size-4 animate-spin" />正在渲染页面…</div>}
            {signatureUrl && pageSize && pageSupported && renderedPageIndex === pageIndex && !isRendering && (
              <button
                aria-label="拖动签名图片，方向键微调位置，按住 Shift 可加快移动"
                className="absolute touch-none cursor-move border-2 border-emerald-600 bg-white/20 p-0 outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                onKeyDown={moveWithKeyboard}
                onPointerCancel={endDrag}
                onPointerDown={beginDrag}
                onPointerMove={drag}
                onPointerUp={endDrag}
                disabled={isProcessing}
                style={{
                  left: `${placement.xRatio * 100}%`,
                  top: `${placement.yRatio * 100}%`,
                  width: `${placement.widthRatio * 100}%`,
                  height: `${signatureHeightRatio * 100}%`,
                }}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="签名或印章位置预览" className="pointer-events-none block size-full object-fill" draggable={false} src={signatureUrl} />
                <span className="pointer-events-none absolute -right-5 -top-5 grid size-11 place-items-center rounded-full border border-emerald-600 bg-white text-emerald-700 shadow-card"><Move aria-hidden="true" className="size-4" /></span>
              </button>
            )}
          </div>

          {pageSizes.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button aria-label="上一页" className="grid size-11 place-items-center rounded-xl border border-slate-300 text-slate-600 transition hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-30" disabled={pageIndex === 0 || isLoadingFile || isProcessing || isRendering} onClick={() => void goToPage(pageIndex - 1)} type="button"><ChevronLeft aria-hidden="true" className="size-4" /></button>
              <label className="min-w-0 text-sm font-medium text-slate-700">
                目标页
                <select className="ml-2 max-w-44 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" disabled={isLoadingFile || isProcessing || isRendering} onChange={(event) => void goToPage(Number(event.target.value))} value={pageIndex}>
                  {pageSizes.map((page, index) => <option key={index} value={index}>第 {index + 1} 页{page.supported ? "" : "（不支持）"}</option>)}
                </select>
              </label>
              <button aria-label="下一页" className="grid size-11 place-items-center rounded-xl border border-slate-300 text-slate-600 transition hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-30" disabled={pageIndex === pageSizes.length - 1 || isLoadingFile || isProcessing || isRendering} onClick={() => void goToPage(pageIndex + 1)} type="button"><ChevronRight aria-hidden="true" className="size-4" /></button>
            </div>
          )}
        </div>

        <div className="space-y-5 rounded-2xl bg-slate-50 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">签名或印章图片</p>
            <label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
              <ImagePlus aria-hidden="true" className="size-4" />选择 PNG / JPG（最大 20 MB）
              <input accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="sr-only" disabled={isLoadingFile || isRendering || isProcessing} type="file" onChange={(event) => { void selectSignature(event.target.files?.[0]); event.target.value = ""; }} />
            </label>
            {signatureName && <p className="mt-2 truncate text-xs text-slate-600">{signatureName}</p>}
          </div>

          <label className="block text-sm font-semibold text-slate-900" htmlFor="pdf-signature-size">
            图片宽度 <span className="font-medium text-slate-500">{Math.round(placement.widthRatio * 100)}%</span>
            <input className="mt-3 w-full accent-emerald-700" disabled={!signatureBytes || !pageSize || !pageSupported || isLoadingFile || isProcessing} id="pdf-signature-size" max="60" min="10" onChange={(event) => updatePlacement({ ...placement, widthRatio: Number(event.target.value) / 100 })} step="1" type="range" value={Math.round(placement.widthRatio * 100)} />
          </label>
          <p className="text-xs leading-5 text-slate-500">在左侧图片上拖动定位；也可用方向键微调，Shift + 方向键快速移动。</p>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
            这只是把签名或印章图片插入 PDF，不会生成数字证书，也不等同于具有法律效力的数字签名。
          </div>

          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!pdfBytes || !signatureBytes || !pageSupported || isLoadingFile || isProcessing || isRendering || renderedPageIndex !== pageIndex} onClick={() => void exportPdf()} type="button">
            {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {isProcessing ? "正在处理" : "插入图片并下载 PDF"}
          </button>
        </div>
      </div>

      <p aria-live="polite" className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${hasError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>
    </section>
  );
}
