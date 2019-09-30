export const snapToGrid = (
  columnWidth: number,
  rowHeight: number,
  x: number,
  y: number,
) => {
  const snappedX = Math.floor(x / columnWidth);
  const snappedY = Math.floor(y / rowHeight);
  return [snappedX, snappedY];
};
