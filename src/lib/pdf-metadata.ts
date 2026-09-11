/**
 * PDF 元数据读取与改写（基于 pdf-lib，浏览器/Node 两侧通用）。
 * 用于查看文档信息、编辑标题作者等，或一键清空生成软件痕迹。
 */

import { PDFDocument } from "pdf-lib";

export type PdfMetadata = {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  /** ISO 字符串，原始 PDF 未写入时为 null */
  creationDate: string | null;
  modificationDate: string | null;
};

export const EMPTY_PDF_METADATA: PdfMetadata = {
  title: "",
  author: "",
  subject: "",
  keywords: [],
  creator: "",
  producer: "",
  creationDate: null,
  modificationDate: null,
};

export async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
}

export async function readPdfMetadata(bytes: Uint8Array): Promise<PdfMetadata> {
  const doc = await loadPdf(bytes);
  const toIso = (date?: Date | null): string | null => (date ? date.toISOString() : null);
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: (doc.getKeywords() ?? '').split(/\s+/).filter(Boolean),
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
    creationDate: toIso(doc.getCreationDate()),
    modificationDate: toIso(doc.getModificationDate()),
  };
}

export type MetadataPatch = Partial<Omit<PdfMetadata, "creationDate" | "modificationDate">> & {
  /** 把创建/修改时间也清掉（保留字段但写入当前时间之前的占位会更有意义，这里直接移除显示） */
  clearDates?: boolean;
};

/** 应用元数据修改并返回新 PDF 字节。未提供的字段保持原样。 */
export async function applyPdfMetadata(bytes: Uint8Array, patch: MetadataPatch): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);

  if (patch.title !== undefined) doc.setTitle(patch.title);
  if (patch.author !== undefined) doc.setAuthor(patch.author);
  if (patch.subject !== undefined) doc.setSubject(patch.subject);
  if (patch.keywords !== undefined) doc.setKeywords(patch.keywords.filter((keyword) => keyword.trim() !== ""));
  if (patch.creator !== undefined) doc.setCreator(patch.creator);
  if (patch.producer !== undefined) doc.setProducer(patch.producer);
  if (patch.clearDates) {
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));
  } else {
    doc.setModificationDate(new Date());
  }

  return doc.save();
}
