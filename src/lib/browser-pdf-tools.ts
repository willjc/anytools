export const IMAGE_TO_PDF_LIMITS = {
  maxFiles: 30,
  maxFileBytes: 20 * 1024 * 1024,
  maxTotalBytes: 100 * 1024 * 1024,
  maxPixelsPerImage: 40_000_000,
  maxTotalPixels: 100_000_000,
} as const;

export const PDF_TO_IMAGE_MAX_PAGES = 20;

export type ImageKind = "jpeg" | "png" | "webp";
export type ImagePageMode = "original" | "a4";

type ImageSize = { width: number; height: number };

export type ImagePdfLayout = {
  pageWidth: number;
  pageHeight: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
};

const A4_SHORT_EDGE = 595.28;
const A4_LONG_EDGE = 841.89;
const A4_MARGIN = 28.35;

export function getImageKind(mimeType: string, fileName: string): ImageKind | undefined {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpeg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType.startsWith("image/")) return undefined;

  const extension = fileName.toLowerCase().match(/\.([^.]+)$/)?.[1];
  if (extension === "jpg" || extension === "jpeg") return "jpeg";
  if (extension === "png" || extension === "webp") return extension;
  return undefined;
}

export function getImageLimitError(images: ImageSize[]): string | undefined {
  if (images.length > IMAGE_TO_PDF_LIMITS.maxFiles) {
    return `一次最多处理 ${IMAGE_TO_PDF_LIMITS.maxFiles} 张图片。`;
  }

  let totalPixels = 0;
  for (const image of images) {
    if (!Number.isFinite(image.width) || !Number.isFinite(image.height) || image.width < 1 || image.height < 1) {
      return "图片尺寸无效。";
    }
    const pixels = image.width * image.height;
    if (pixels > IMAGE_TO_PDF_LIMITS.maxPixelsPerImage) {
      return "单张图片最多 4000 万像素。";
    }
    totalPixels += pixels;
  }

  return totalPixels > IMAGE_TO_PDF_LIMITS.maxTotalPixels ? "图片总像素最多 1 亿，请减少图片数量或分辨率。" : undefined;
}

export function getImageFileLimitError(fileBytes: number, totalBytes: number): string | undefined {
  if (!Number.isFinite(fileBytes) || fileBytes < 0 || !Number.isFinite(totalBytes) || totalBytes < fileBytes) {
    return "图片文件大小无效。";
  }
  if (fileBytes > IMAGE_TO_PDF_LIMITS.maxFileBytes) return "单张图片不能超过 20 MB。";
  return totalBytes > IMAGE_TO_PDF_LIMITS.maxTotalBytes ? "全部图片合计不能超过 100 MB。" : undefined;
}

export function getImagePdfLayout(width: number, height: number, mode: ImagePageMode): ImagePdfLayout {
  if (mode === "original") {
    const scale = A4_LONG_EDGE / Math.max(width, height);
    const pageWidth = width * scale;
    const pageHeight = height * scale;
    return { pageWidth, pageHeight, drawX: 0, drawY: 0, drawWidth: pageWidth, drawHeight: pageHeight };
  }

  const landscape = width > height;
  const pageWidth = landscape ? A4_LONG_EDGE : A4_SHORT_EDGE;
  const pageHeight = landscape ? A4_SHORT_EDGE : A4_LONG_EDGE;
  const scale = Math.min((pageWidth - A4_MARGIN * 2) / width, (pageHeight - A4_MARGIN * 2) / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;

  return {
    pageWidth,
    pageHeight,
    drawX: (pageWidth - drawWidth) / 2,
    drawY: (pageHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  };
}

export function getScaledSize(width: number, height: number, maxDimension: number): ImageSize {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
