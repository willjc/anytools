"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, LoaderCircle } from "lucide-react";

import { formatFileSize } from "@/lib/file-utils";

type Rows = string[][];

export function PdfToExcelWorkbench() {
  const [file, setFile] = useState<File>();
  const [tables, setTables] = useState<Rows[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState("上传含表格的 PDF（报表 / 账单 / 成绩单），MinerU 云端识别后生成可编辑的 Excel。\n");
  const [expanded, setExpanded] = useState<number | null>(0);
  const resultRef = useRef<HTMLDivElement | null>(null);

  async function parse(selected: File) {
    setIsParsing(true);
    setTables([]);
    setMessage("上传并识别中，通常需要 30~90 秒，请保持页面打开…");
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const response = await fetch("/api/tools/pdf-to-excel", { method: "POST", body: formData });
      const data = (await response.json()) as { tables?: Rows[]; truncated?: boolean; error?: string };
      if (!response.ok) {
        setMessage(`${data.error ?? "解析失败，请稍后重试。"}\n`);
        return;
      }
      const found = data.tables ?? [];
      setTables(found);
      if (found.length === 0) {
        setMessage("没有识别到表格。如果这是扫描件或图片型 PDF，MinerU 已做 OCR，但仍可能因版式复杂漏检；可尝试『文档转 Markdown』查看完整识别结果。");
      } else {
        setMessage(`识别到 ${found.length} 个表格，预览确认后即可下载 Excel。`);
      }
    } catch {
      setMessage("解析失败，请检查网络后重试。\n");
    } finally {
      setIsParsing(false);
    }
  }

  async function download() {
    if (tables.length === 0 || !file) return;
    setIsExporting(true);
    try {
      const response = await fetch("/api/tools/pdf-to-excel/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables, name: file.name.replace(/\.pdf$/i, "") }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(`${data?.error ?? "导出失败，请重试。"}\n`);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file.name.replace(/\.pdf$/i, "")}.xlsx`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("Excel 已开始下载，每个表格对应一个工作表。\n");
    } catch {
      setMessage("导出失败，请重试。\n");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section aria-label="PDF 转 Excel 工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d9f3e1] text-emerald-800">
            <FileSpreadsheet aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">MinerU 云端识别 · 用后即删</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 转 Excel</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">表格还原 · 可编辑</span>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            选择 PDF 文件
            <input
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                setFile(selected);
                setTables([]);
                if (selected) {
                  setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}），点击「开始识别」。`);
                  void parse(selected);
                }
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          {file && <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}
        </div>

        {isParsing && (
          <p className="inline-flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            MinerU 正在识别表格，通常需要 30~90 秒…
          </p>
        )}

        {tables.length > 0 && (
          <div className="space-y-3" ref={resultRef}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">识别到 {tables.length} 个表格</p>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isExporting}
                onClick={() => void download()}
                type="button"
              >
                {isExporting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
                {isExporting ? "打包中" : "下载 Excel（.xlsx）"}
              </button>
            </div>
            {tables.map((rows, tableIndex) => {
              const open = expanded === tableIndex;
              return (
                <div className="overflow-hidden rounded-2xl border border-slate-200" key={tableIndex}>
                  <button
                    aria-expanded={open}
                    className="flex w-full items-center justify-between bg-slate-50 px-4 py-2.5 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    onClick={() => setExpanded(open ? null : tableIndex)}
                    type="button"
                  >
                    <span>表 {tableIndex + 1}（{rows.length} 行）</span>
                    <span className="text-xs font-normal text-slate-500">{open ? "收起" : "展开预览"}</span>
                  </button>
                  {open && (
                    <div className="max-h-72 overflow-auto">
                      <table className="w-full border-collapse text-sm">
                        <tbody>
                          {rows.slice(0, 12).map((row, rowIndex) => (
                            <tr className="border-b border-slate-100" key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td className={`px-3 py-2 align-top ${rowIndex === 0 ? "bg-slate-50 font-semibold text-slate-900" : "text-slate-700"}`} key={cellIndex}>
                                  {cell || <span className="text-slate-300">—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {rows.length > 12 && <p className="px-4 py-2 text-xs text-slate-500">预览仅显示前 12 行，共 {rows.length} 行，完整内容在下载的 Excel 中。</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs leading-5 text-slate-500">复杂合并单元格可能出现错位；识别由 MinerU 云端完成，文件处理完立即删除。</p>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
