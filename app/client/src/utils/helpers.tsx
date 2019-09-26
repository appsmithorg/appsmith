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

export const getRowColSizes = (
  rowCount: number,
  columnCount: number,
  width: number,
  height: number,
): { rowHeight: number; columnWidth: number } => {
  return {
    columnWidth: Math.floor(width / columnCount),
    rowHeight: Math.floor(height / rowCount),
  };
};
