export const snapToGrid = (cellSize: number, x: number, y: number) => {
  const snappedX = Math.floor(x / cellSize) * cellSize;
  const snappedY = Math.floor(y / cellSize) * cellSize;
  return [snappedX, snappedY];
};
