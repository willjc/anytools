"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, Eraser, LoaderCircle, Tag } from "lucide-react";

import { formatFileSize } from "@/lib/file-utils";
import { applyPdfMetadata, readPdfMetadata, type PdfMetadata } from "@/lib/pdf-metadata";

type Fields = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
};

export function PdfMetadataWorkbench() {
  const [file, setFile] = useState<File>();
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fields, setFields] = useState<Fields>({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" });
  const [originalInfo, setOriginalInfo] = useState<PdfMetadata | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("上传 PDF 查看当前元数据；可编辑标题作者等信息，或一键清空生成软件痕迹后下载。\n");
  const abortRef = useRef<AbortController | null>(null);

  const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
  const label = "block text-sm font-semibold text-slate-900";

  async function pick(selected: File) {
    abortRef.current?.abort();
    setIsWorking(true);
    setFile(selected);
    setOriginalInfo(null);
    setMessage("正在读取元数据…");
    try {
      const fileBytes = new Uint8Array(await selected.arrayBuffer());
      setBytes(fileBytes);
      const metadata = await readPdfMetadata(fileBytes);
      setOriginalInfo(metadata);
      setFields({
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        keywords: metadata.keywords.join("，"),
        creator: metadata.creator,
        producer: metadata.producer,
      });
      setMessage(`读取完成：${metadata.title || "（无标题）"}，创建于 ${metadata.creationDate ? metadata.creationDate.slice(0, 10) : "未知"}。编辑后点击下载。`);
    } catch {
      setMessage("读取失败：文件可能已损坏或设置了打开密码。\n");
      setBytes(null);
    } finally {
      setIsWorking(false);
    }
  }

  function collectPatch() {
    return {
      title: fields.title.trim(),
      author: fields.author.trim(),
      subject: fields.subject.trim(),
      keywords: fields.keywords.split(/[，,]/).map((item) => item.trim()).filter(Boolean),
      creator: fields.creator.trim(),
      producer: fields.producer.trim(),
    };
  }

  async function save(clearDates: boolean) {
    if (!bytes || !file) return;
    setIsWorking(true);
    try {
      const updated = await applyPdfMetadata(bytes, { ...collectPatch(), clearDates });
      const blob = new Blob([updated as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file.name.replace(/\.pdf$/i, "")}-元数据.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(clearDates ? "已清空生成痕迹并下载；标题作者等已按填写内容写入。\n" : "元数据已更新并下载。\n");
    } catch {
      setMessage("保存失败，请重试。\n");
    } finally {
      setIsWorking(false);
    }
  }

  function resetToOriginal() {
    if (!originalInfo) return;
    setFields({
      title: originalInfo.title,
      author: originalInfo.author,
      subject: originalInfo.subject,
      keywords: originalInfo.keywords.join("，"),
      creator: originalInfo.creator,
      producer: originalInfo.producer,
    });
  }

  async function copyAll() {
    if (!originalInfo) return;
    await navigator.clipboard.writeText(
      Object.entries(originalInfo)
        .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join("、") : value}`)
        .join("\n"),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section aria-label="PDF 元数据工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d9f3e1] text-emerald-800">
            <Tag aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地处理 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 元数据编辑</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">查看 · 编辑 · 清痕迹</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div>
            <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
              选择 PDF 文件
              <input accept=".pdf,application/pdf" className="sr-only" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void pick(selected); event.target.value = ""; }} type="file" />
            </label>
            {file && <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="pdfm-title">标题</label><input className={field} id="pdfm-title" onChange={(event) => setFields((previous) => ({ ...previous, title: event.target.value }))} type="text" value={fields.title} /></div>
            <div><label className={label} htmlFor="pdfm-author">作者</label><input className={field} id="pdfm-author" onChange={(event) => setFields((previous) => ({ ...previous, author: event.target.value }))} type="text" value={fields.author} /></div>
            <div><label className={label} htmlFor="pdfm-subject">主题</label><input className={field} id="pdfm-subject" onChange={(event) => setFields((previous) => ({ ...previous, subject: event.target.value }))} type="text" value={fields.subject} /></div>
            <div><label className={label} htmlFor="pdfm-keywords">关键词（逗号分隔）</label><input className={field} id="pdfm-keywords" onChange={(event) => setFields((previous) => ({ ...previous, keywords: event.target.value }))} type="text" value={fields.keywords} /></div>
            <div><label className={label} htmlFor="pdfm-creator">创建程序</label><input className={field} id="pdfm-creator" onChange={(event) => setFields((previous) => ({ ...previous, creator: event.target.value }))} type="text" value={fields.creator} /></div>
            <div><label className={label} htmlFor="pdfm-producer">生成程序（Producer）</label><input className={field} id="pdfm-producer" onChange={(event) => setFields((previous) => ({ ...previous, producer: event.target.value }))} type="text" value={fields.producer} /></div>
          </div>

          {originalInfo && (
            <button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-700" onClick={resetToOriginal} type="button">
              恢复为原文件内容
            </button>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!bytes || isWorking}
              onClick={() => void save(false)}
              type="button"
            >
              {isWorking ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
              保存并下载
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!bytes || isWorking}
              onClick={() => {
                setFields((previous) => ({ ...previous, creator: "", producer: "", subject: "", keywords: "" }));
                void save(true);
              }}
              type="button"
            >
              <Eraser aria-hidden="true" className="size-4" />
              清空痕迹并下载
            </button>
            {originalInfo && (
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" onClick={() => void copyAll()} type="button">
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "已复制" : "复制元数据"}
              </button>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500">「清空痕迹」会把创建/生成程序与关键词置空，适合对外分享前去除个人信息；修改在浏览器本地完成。</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">原始元数据</p>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6">
            {originalInfo ? (
              <dl className="space-y-1.5 text-slate-700">
                {(
                  [
                    ["标题", originalInfo.title],
                    ["作者", originalInfo.author],
                    ["主题", originalInfo.subject],
                    ["关键词", originalInfo.keywords.join("、")],
                    ["创建程序", originalInfo.creator],
                    ["生成程序", originalInfo.producer],
                    ["创建时间", originalInfo.creationDate?.slice(0, 19).replace("T", " ") ?? "未知"],
                    ["修改时间", originalInfo.modificationDate?.slice(0, 19).replace("T", " ") ?? "未知"],
                  ] as const
                ).map(([key, value]) => (
                  <div className="flex gap-3" key={key}>
                    <dt className="w-16 shrink-0 text-slate-400">{key}</dt>
                    <dd className="min-w-0 break-all">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">{isWorking ? "读取中…" : "上传 PDF 后在这里显示原始信息"}</p>
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
