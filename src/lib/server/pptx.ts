/**
 * 用 pptxgenjs 把幻灯片结构渲染成 .pptx 文件。
 * 视觉遵循站点设计语言：暖白画布、炭墨文字、翡翠主色、发丝线分隔。
 */

import PptxGenJS from "pptxgenjs";

import type { DeckMeta, Slide } from "@/lib/ai-ppt";

const INK = "21201C";
const INK_SOFT = "5F5D56";
const INK_FADED = "A5A199";
const EMERALD = "047857";
const EMERALD_SOFT = "D1FAE5";
const CANVAS = "FBFBFA";
const HAIRLINE = "E7E4DF";
const FONT = "Microsoft YaHei";

const PAGE_W = 13.33;
const PAGE_H = 7.5;
const MARGIN = 0.9;

function addFooter(pptx: PptxGenJS, slide: PptxGenJS.Slide, meta: DeckMeta, index: number, total: number): void {
  slide.addText(meta.title, {
    x: MARGIN,
    y: PAGE_H - 0.52,
    w: PAGE_W - MARGIN * 2 - 0.8,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT,
    color: INK_FADED,
    valign: "middle",
  });
  slide.addText(`${index} / ${total}`, {
    x: PAGE_W - MARGIN - 0.8,
    y: PAGE_H - 0.52,
    w: 0.8,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT,
    color: INK_FADED,
    align: "right",
    valign: "middle",
  });
  slide.addShape(pptx.ShapeType.line, {
    x: MARGIN,
    y: PAGE_H - 0.72,
    w: PAGE_W - MARGIN * 2,
    h: 0,
    line: { color: HAIRLINE, width: 0.75 },
  });
}

function addCoverSlide(pptx: PptxGenJS, meta: DeckMeta): void {
  const slide = pptx.addSlide();
  slide.background = { color: CANVAS };

  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN,
    y: 2.55,
    w: 0.55,
    h: 0.09,
    fill: { color: EMERALD },
  });
  slide.addText(meta.title, {
    x: MARGIN - 0.04,
    y: 2.75,
    w: PAGE_W - MARGIN * 2,
    h: 1.35,
    fontSize: 40,
    bold: true,
    fontFace: FONT,
    color: INK,
    valign: "top",
  });
  if (meta.subtitle) {
    slide.addText(meta.subtitle, {
      x: MARGIN - 0.04,
      y: 4.15,
      w: PAGE_W - MARGIN * 2,
      h: 0.6,
      fontSize: 16,
      fontFace: FONT,
      color: INK_SOFT,
      valign: "top",
    });
  }
  slide.addText("AI 生成 · 供参考初稿", {
    x: MARGIN - 0.04,
    y: PAGE_H - 0.85,
    w: 5,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: INK_FADED,
  });
}

function addSectionSlide(pptx: PptxGenJS, meta: DeckMeta, slide0: Slide, index: number, total: number): void {
  const slide = pptx.addSlide();
  slide.background = { color: EMERALD_SOFT };
  const sectionNo = String(index).padStart(2, "0");
  slide.addText(sectionNo, {
    x: MARGIN,
    y: 2.35,
    w: 3,
    h: 0.7,
    fontSize: 28,
    bold: true,
    fontFace: FONT,
    color: EMERALD,
  });
  slide.addText(slide0.title, {
    x: MARGIN - 0.02,
    y: 3.05,
    w: PAGE_W - MARGIN * 2,
    h: 1.1,
    fontSize: 30,
    bold: true,
    fontFace: FONT,
    color: INK,
    valign: "top",
  });
  if (slide0.subtitle) {
    slide.addText(slide0.subtitle, {
      x: MARGIN - 0.02,
      y: 4.2,
      w: PAGE_W - MARGIN * 2,
      h: 0.6,
      fontSize: 14,
      fontFace: FONT,
      color: INK_SOFT,
    });
  }
  addFooter(pptx, slide, meta, index, total);
}

function addContentSlide(pptx: PptxGenJS, meta: DeckMeta, slide0: Slide, index: number, total: number): void {
  const slide = pptx.addSlide();
  slide.background = { color: CANVAS };

  slide.addText(slide0.title, {
    x: MARGIN - 0.02,
    y: 0.75,
    w: PAGE_W - MARGIN * 2,
    h: 0.75,
    fontSize: 24,
    bold: true,
    fontFace: FONT,
    color: INK,
    valign: "middle",
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN,
    y: 1.62,
    w: 0.42,
    h: 0.06,
    fill: { color: EMERALD },
  });

  if (slide0.bullets && slide0.bullets.length > 0) {
    const rows = slide0.bullets.map((text) => ({
      text,
      options: { bullet: { characterCode: "2022", indent: 18 }, breakLine: true },
    }));
    slide.addText(rows, {
      x: MARGIN,
      y: 2.0,
      w: PAGE_W - MARGIN * 2,
      h: PAGE_H - 2.0 - 1.2,
      fontSize: 15,
      fontFace: FONT,
      color: INK,
      valign: "top",
      paraSpaceAfter: 10,
      lineSpacingMultiple: 1.15,
    });
  } else if (slide0.body) {
    slide.addText(slide0.body, {
      x: MARGIN,
      y: 2.0,
      w: PAGE_W - MARGIN * 2,
      h: PAGE_H - 2.0 - 1.2,
      fontSize: 15,
      fontFace: FONT,
      color: INK,
      valign: "top",
      lineSpacingMultiple: 1.3,
    });
  }

  if (slide0.notes) {
    slide.addNotes(slide0.notes);
  }
  addFooter(pptx, slide, meta, index, total);
}

function addClosingSlide(pptx: PptxGenJS, slide0: Slide): void {
  const slide = pptx.addSlide();
  slide.background = { color: CANVAS };
  slide.addText(slide0.title, {
    x: MARGIN,
    y: 2.9,
    w: PAGE_W - MARGIN * 2,
    h: 1.1,
    fontSize: 34,
    bold: true,
    fontFace: FONT,
    color: INK,
    align: "center",
  });
  if (slide0.body) {
    slide.addText(slide0.body, {
      x: MARGIN + 1.2,
      y: 4.15,
      w: PAGE_W - (MARGIN + 1.2) * 2,
      h: 0.8,
      fontSize: 14,
      fontFace: FONT,
      color: INK_SOFT,
      align: "center",
    });
  }
  slide.addShape(pptx.ShapeType.rect, {
    x: PAGE_W / 2 - 0.28,
    y: 5.2,
    w: 0.55,
    h: 0.09,
    fill: { color: EMERALD },
  });
}

export function buildPptx(meta: DeckMeta, slides: Slide[]): Promise<Uint8Array> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE_16_9", width: PAGE_W, height: PAGE_H });
  pptx.layout = "WIDE_16_9";
  pptx.author = "万用工具箱";
  pptx.title = meta.title;

  const contentCount = slides.length + 1; // 封面计入总数
  addCoverSlide(pptx, meta);
  slides.forEach((slide, i) => {
    if (slide.layout === "section") addSectionSlide(pptx, meta, slide, i + 2, contentCount);
    else if (slide.layout === "closing") addClosingSlide(pptx, slide);
    else addContentSlide(pptx, meta, { ...slide, layout: "content" }, i + 2, contentCount);
  });

  return pptx.write({ outputType: "nodebuffer" }) as Promise<Uint8Array>;
}
