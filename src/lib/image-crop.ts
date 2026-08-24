export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FitCropRectInput = {
  imageWidth: number;
  imageHeight: number;
  ratioWidth: number;
  ratioHeight: number;
};

export function fitCropRect({ imageWidth, imageHeight, ratioWidth, ratioHeight }: FitCropRectInput): CropRect {
  if (ratioWidth <= 0 || ratioHeight <= 0) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }

  const targetAspect = ratioWidth / ratioHeight;
  const imageAspect = imageWidth / imageHeight;

  if (imageAspect > targetAspect) {
    const width = imageHeight * targetAspect;
    return { x: (imageWidth - width) / 2, y: 0, width, height: imageHeight };
  }

  const height = imageWidth / targetAspect;
  return { x: 0, y: (imageHeight - height) / 2, width: imageWidth, height };
}
