export type StitchDirection = "vertical" | "horizontal";

export type StitchSourceSize = {
  width: number;
  height: number;
};

export type StitchLayout = {
  canvasWidth: number;
  canvasHeight: number;
  scaledSizes: { width: number; height: number }[];
  offsets: { x: number; y: number }[];
};

export function computeStitchLayout(sizes: readonly StitchSourceSize[], direction: StitchDirection): StitchLayout {
  if (sizes.length === 0) {
    throw new Error("请至少选择一张图片。");
  }

  if (direction === "vertical") {
    const canvasWidth = Math.min(...sizes.map((size) => size.width));
    const scaledSizes = sizes.map((size) => ({
      width: canvasWidth,
      height: Math.round((size.height * canvasWidth) / size.width),
    }));
    const canvasHeight = scaledSizes.reduce((total, size) => total + size.height, 0);

    let cursorY = 0;
    const offsets = scaledSizes.map((size) => {
      const offset = { x: 0, y: cursorY };
      cursorY += size.height;
      return offset;
    });
    return { canvasWidth, canvasHeight, scaledSizes, offsets };
  }

  const canvasHeight = Math.min(...sizes.map((size) => size.height));
  const scaledSizes = sizes.map((size) => ({
    width: Math.round((size.width * canvasHeight) / size.height),
    height: canvasHeight,
  }));
  const canvasWidth = scaledSizes.reduce((total, size) => total + size.width, 0);

  let cursorX = 0;
  const offsets = scaledSizes.map((size) => {
    const offset = { x: cursorX, y: 0 };
    cursorX += size.width;
    return offset;
  });
  return { canvasWidth, canvasHeight, scaledSizes, offsets };
}
