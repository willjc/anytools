export type GridSlice = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function computeGridSlices(imageWidth: number, imageHeight: number): GridSlice[] {
  const side = Math.min(imageWidth, imageHeight);
  const originX = (imageWidth - side) / 2;
  const originY = (imageHeight - side) / 2;
  const cell = side / 3;

  const slices: GridSlice[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      slices.push({
        x: originX + column * cell,
        y: originY + row * cell,
        width: cell,
        height: cell,
      });
    }
  }
  return slices;
}
