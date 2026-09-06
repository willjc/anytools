"use client";

import { useRef, useState } from "react";
import { FileUp, LoaderCircle, Printer } from "lucide-react";

import { formatFileSize } from "@/lib/file-utils";
import { buildPrintLayout, fitIntoCell, pagesNeeded, type PrintPerPage } from "@/lib/invoice-print";
import type { PDFPage } from "pdf-lib";

import { renderPdfPageToCanvas } from "@/lib/pdf-render";

type PickedFile = { file: File; pageCount: number; error?: string };

async function loadPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

async function composeSheets(
  files: File[],
  perPage: PrintPerPage,
  guides: boolean,
): Promise<{ bytes: Uint8Array; totalPages: number; sheetCount: number }> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const out = await PDFDocument.create();
  const layout = buildPrintLayout(perPage);
  let cellIndex = 0;
  let sheet: PDFPage | null = null;

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const indices = doc.getPageIndices();
    const embeddedPages = await out.embedPdf(doc, indices);
    for (const embedded of embeddedPages) {
      const cellSlot = cellIndex % perPage;
      if (cellSlot === 0) {
        sheet = out.addPage([layout.pageWidth, layout.pageHeight]);
      }
      const cell = layout.cells[cellSlot];
      const original = embedded.width / embedded.height; // embedPdf 尺寸按原始页面
      const fitted = fitIntoCell(cell, embedded.width, embedded.height);
      sheet!.drawPage(embedded, {
        x: fitted.x,
        y: fitted.y,
        width: fitted.width,
        height: fitted.height,
      });
      if (guides) {
        sheet!.drawRectangle({
          x: cell.x,
          y: cell.y,
          width: cell.width,
          height: cell.height,
          borderColor: rgb(0.62, 0.62, 0.6),
          borderWidth: 0.5,
          borderOpacity: 0.5,
          borderDashArray: [4, 4],
        });
      }
      void original;
      cellIndex += 1;
    }
  }
  return { bytes: await out.save(), totalPages: cellIndex, sheetCount: pagesNeeded(cellIndex, perPage) };
}

export function InvoicePrintWorkbench() {
  const [files, setFiles] = useState<File[]>([]);
  const [perPage, setPerPage] = useState<PrintPerPage>(2);
  const [guides, setGuides] = useState(true);
  const [composed, setComposed] = useState<Uint8Array | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [message, setMessage] = useState("选择多个发票 PDF，自动按 A4 拼版（上 2 下 2 或四合一），下载后直接打印裁开。\n");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function pickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const picked: PickedFile[] = [];
    for (const file of Array.from(list)) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        picked.push({ file, pageCount: 0, error: "不是 PDF 文件" });
        continue;
      }
      try {
        picked.push({ file, pageCount: await loadPageCount(file) });
      } catch {
        picked.push({ file, pageCount: 0, error: "加密或已损坏" });
      }
    }
    setFiles(picked.map((item) => item.file));
    const errors = picked.filter((item) => item.error);
    const okCount = picked.reduce((sum, item) => sum + item.pageCount, 0);
    setMessage(
      errors.length > 0
        ? `已选择 ${picked.length} 个文件；其中 ${errors.length} 个无法读取（${errors.map((item) => `${item.file.name}：${item.error}`).join("、")}），将被跳过。\n`
        : `已选择 ${picked.length} 个文件、共 ${okCount} 页，点击「生成拼版」。`,
    );
  }

  async function compose() {
    const pdfFiles = files.filter((file) => file.name.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      setMessage("请先选择 PDF 发票文件。\n");
      return;
    }
    setIsComposing(true);
    try {
      const { bytes, totalPages, sheetCount } = await composeSheets(pdfFiles, perPage, guides);
      setComposed(bytes);
      setMessage(`拼版完成：共 ${totalPages} 页发票，排入 ${sheetCount} 张 A4，点击下载即可打印。\n`);
      try {
        const canvas = canvasRef.current;
        if (canvas) await renderPdfPageToCanvas(bytes.slice(0).buffer, 1, canvas);
      } catch {
        // 预览失败不影响下载
      }
    } catch (error) {
      setMessage(error instanceof Error ? `生成失败：${error.message}\n` : "生成失败，请重试。\n");
    } finally {
      setIsComposing(false);
    }
  }

  function download() {
    if (!composed) return;
    const blob = new Blob([composed as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "发票拼版.pdf";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("拼版 PDF 已下载，打印时选择「实际大小」即可。\n");
  }

  return (
    <section aria-label="发票拼版工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d9f3e1] text-emerald-800">
            <Printer aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">发票拼版打印</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">省纸 · 一次打完</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div>
            <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
              选择多个发票 PDF
              <input
                accept=".pdf,application/pdf"
                className="sr-only"
                multiple
                onChange={(event) => {
                  void pickFiles(event.target.files);
                  event.target.value = "";
                }}
                type="file"
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file) => (
                  <li className="truncate text-sm text-slate-700" key={file.name}>
                    {file.name}（{formatFileSize(file.size)}）
                  </li>
                ))}
              </ul>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">每张 A4 打印</legend>
            <div className="mt-2 flex gap-2">
              {([1, 2, 4] as PrintPerPage[]).map((count) => (
                <button
                  aria-pressed={perPage === count}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${perPage === count ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"}`}
                  key={count}
                  onClick={() => setPerPage(count)}
                  type="button"
                >
                  {count === 1 ? "1 张（原大）" : `${count} 张`}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
            <input checked={guides} className="size-4 accent-emerald-700" onChange={(event) => setGuides(event.target.checked)} type="checkbox" />
            显示裁切参考线
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={files.length === 0 || isComposing}
              onClick={() => void compose()}
              type="button"
            >
              {isComposing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Printer aria-hidden="true" className="size-4" />}
              {isComposing ? "拼版中" : "生成拼版"}
            </button>
            {composed && (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-950"
                onClick={download}
                type="button"
              >
                下载拼版 PDF
              </button>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500">每个 PDF 的所有页面各占一格，自动等比缩放居中；打印时选择「实际大小」，沿虚线裁开。</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">拼版预览（第 1 页）</p>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <canvas className="h-auto w-full rounded-lg bg-white shadow-card" ref={canvasRef} />
            {!composed && (
              <div className="grid place-items-center py-16 text-center">
                <div>
                  <FileUp aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">还没有拼版结果</p>
                  <p className="mt-1 text-xs text-slate-400">选择发票文件并点击「生成拼版」</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
