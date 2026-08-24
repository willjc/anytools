export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type WatermarkAnchorInput = {
  imageWidth: number;
  imageHeight: number;
  boxWidth: number;
  boxHeight: number;
  position: WatermarkPosition;
  marginRatio: number;
};

export function computeWatermarkAnchor({
  imageWidth,
  imageHeight,
  boxWidth,
  boxHeight,
  position,
  marginRatio,
}: WatermarkAnchorInput): { x: number; y: number } {
  const margin = marginRatio * Math.min(imageWidth, imageHeight);

  let x = margin;
  if (position.endsWith("center")) x = (imageWidth - boxWidth) / 2;
  if (position.endsWith("right")) x = imageWidth - margin - boxWidth;

  let y = margin;
  if (position === "center") y = (imageHeight - boxHeight) / 2;
  if (position.startsWith("bottom")) y = imageHeight - margin - boxHeight;

  return { x: Math.max(0, x), y: Math.max(0, y) };
}
