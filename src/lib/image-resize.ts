export type ResizeMode = "width" | "height" | "exact";

export const MAX_RESIZE_BATCH_PIXELS = 100_000_000;

type ResizeInput = {
  sourceWidth: number;
  sourceHeight: number;
  mode: ResizeMode;
  targetWidth: number;
  targetHeight: number;
  keepAspect: boolean;
};

function requirePositive(value: number) {
  if (!Number.isFinite(value) || value < 1) throw new Error("图片尺寸至少为 1 像素。");
}

export function calculateResizeDimensions({ sourceWidth, sourceHeight, mode, targetWidth, targetHeight, keepAspect }: ResizeInput) {
  requirePositive(sourceWidth);
  requirePositive(sourceHeight);

  if (mode === "width") {
    requirePositive(targetWidth);
    return { width: Math.round(targetWidth), height: Math.max(1, Math.round((targetWidth * sourceHeight) / sourceWidth)) };
  }

  if (mode === "height") {
    requirePositive(targetHeight);
    return { width: Math.max(1, Math.round((targetHeight * sourceWidth) / sourceHeight)), height: Math.round(targetHeight) };
  }

  requirePositive(targetWidth);
  requirePositive(targetHeight);
  if (!keepAspect) return { width: Math.round(targetWidth), height: Math.round(targetHeight) };

  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  return { width: Math.max(1, Math.round(sourceWidth * scale)), height: Math.max(1, Math.round(sourceHeight * scale)) };
}

export function isResizeBatchTooLarge(sizes: Array<{ width: number; height: number }>) {
  return sizes.reduce((total, size) => total + size.width * size.height, 0) > MAX_RESIZE_BATCH_PIXELS;
}
