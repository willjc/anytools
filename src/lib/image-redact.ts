export type ImagePoint = { x: number; y: number };
export type RedactionRect = { x: number; y: number; width: number; height: number };

type ClientPointInput = {
  clientX: number;
  clientY: number;
  bounds: { left: number; top: number; width: number; height: number };
  imageWidth: number;
  imageHeight: number;
};

export function clientPointToImagePoint({ clientX, clientY, bounds, imageWidth, imageHeight }: ClientPointInput): ImagePoint {
  if (bounds.width <= 0 || bounds.height <= 0 || imageWidth <= 0 || imageHeight <= 0) throw new Error("图片尺寸无效。");
  const x = Math.min(Math.max(clientX - bounds.left, 0), bounds.width);
  const y = Math.min(Math.max(clientY - bounds.top, 0), bounds.height);
  return { x: (x / bounds.width) * imageWidth, y: (y / bounds.height) * imageHeight };
}

export function createRedactionRect(start: ImagePoint, end: ImagePoint): RedactionRect {
  const left = Math.floor(Math.min(start.x, end.x));
  const top = Math.floor(Math.min(start.y, end.y));
  const right = Math.ceil(Math.max(start.x, end.x));
  const bottom = Math.ceil(Math.max(start.y, end.y));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function percentageRectToImageRect(
  rect: RedactionRect,
  imageWidth: number,
  imageHeight: number,
): RedactionRect {
  const values = [rect.x, rect.y, rect.width, rect.height, imageWidth, imageHeight];
  if (values.some((value) => !Number.isFinite(value)) || imageWidth <= 0 || imageHeight <= 0
    || rect.x < 0 || rect.y < 0 || rect.x >= 100 || rect.y >= 100 || rect.width <= 0 || rect.height <= 0) {
    throw new Error("遮挡区域无效。");
  }

  return createRedactionRect(
    { x: imageWidth * rect.x / 100, y: imageHeight * rect.y / 100 },
    {
      x: imageWidth * Math.min(100, rect.x + rect.width) / 100,
      y: imageHeight * Math.min(100, rect.y + rect.height) / 100,
    },
  );
}
