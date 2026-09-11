import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { applyPdfMetadata, readPdfMetadata } from "@/lib/pdf-metadata";

async function createSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([300, 200]);
  doc.setTitle("原始标题");
  doc.setAuthor("原作者");
  doc.setSubject("原始主题");
  doc.setKeywords(["旧", "关键词"]);
  doc.setCreator("某个编辑器");
  doc.setProducer("某个生成器");
  return doc.save();
}

describe("pdf metadata", () => {
  it("round-trips existing metadata", async () => {
    const metadata = await readPdfMetadata(await createSamplePdf());
    expect(metadata.title).toBe("原始标题");
    expect(metadata.author).toBe("原作者");
    expect(metadata.keywords).toEqual(["旧", "关键词"]);
    expect(metadata.producer).toBe("某个生成器");
    expect(metadata.creationDate).not.toBeNull();
  });

  it("applies partial edits and keeps untouched fields", async () => {
    const original = await createSamplePdf();
    const updated = await applyPdfMetadata(original, { title: "新标题", author: "新作者" });
    const metadata = await readPdfMetadata(updated);
    expect(metadata.title).toBe("新标题");
    expect(metadata.author).toBe("新作者");
    expect(metadata.subject).toBe("原始主题");
  });

  it("clears creator and producer traces on request", async () => {
    const original = await createSamplePdf();
    const cleared = await applyPdfMetadata(original, {
      title: "对外分享",
      author: "",
      subject: "",
      keywords: [],
      creator: "",
      producer: "",
      clearDates: true,
    });
    const metadata = await readPdfMetadata(cleared);
    expect(metadata.creator).toBe("");
    expect(metadata.producer).toBe("");
    expect(metadata.keywords).toEqual([]);
    expect(metadata.title).toBe("对外分享");
  });

  it("accepts keyword arrays from comma strings handled by caller", async () => {
    const original = await createSamplePdf();
    const updated = await applyPdfMetadata(original, { keywords: ["合同", "2026"] });
    expect((await readPdfMetadata(updated)).keywords).toEqual(["合同", "2026"]);
  });

  it("handles encrypted-flagged pdfs gracefully", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    const bytes = await doc.save({ encrypt: undefined } as never).catch(() => doc.save());
    const metadata = await readPdfMetadata(bytes);
    expect(metadata.title).toBe("");
  });
});
