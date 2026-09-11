/** 电子书格式常量与守卫（客户端 / 服务端共用，保持无副作用）。 */

export const EBOOK_INPUT_FORMATS = ["epub", "mobi", "azw3", "pdf", "docx", "txt", "html", "rtf"] as const;
export const EBOOK_OUTPUT_FORMATS = ["pdf", "epub", "docx", "txt", "mobi", "azw3"] as const;

export type EbookInputFormat = (typeof EBOOK_INPUT_FORMATS)[number];
export type EbookOutputFormat = (typeof EBOOK_OUTPUT_FORMATS)[number];

export const EBOOK_FORMAT_LABELS: Record<string, string> = {
  pdf: "PDF 文档",
  epub: "EPUB 电子书",
  docx: "Word 文档",
  txt: "纯文本",
  mobi: "MOBI（Kindle）",
  azw3: "AZW3（Kindle）",
};

export const EBOOK_FORMAT_DESCRIPTIONS: Record<string, string> = {
  epub: "通用电子书格式，微信读书 / Apple Books 支持",
  docx: "可编辑的 Word 文档",
  txt: "纯文本，任何设备可读",
  mobi: "Kindle 经典格式",
  azw3: "Kindle 新格式，排版更好",
  pdf: "适合打印与分享，排版固定",
};

export function isEbookInputFormat(value: unknown): value is EbookInputFormat {
  return EBOOK_INPUT_FORMATS.includes(value as EbookInputFormat);
}

export function isEbookOutputFormat(value: unknown): value is EbookOutputFormat {
  return EBOOK_OUTPUT_FORMATS.includes(value as EbookOutputFormat);
}
