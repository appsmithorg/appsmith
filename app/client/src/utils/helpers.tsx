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

export const formatBytes = (bytes: string | number) => {
  if (!bytes) return;
  const value = typeof bytes === "string" ? parseInt(bytes) : bytes;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (value === 0) return "0 bytes";
  const i = parseInt(String(Math.floor(Math.log(value) / Math.log(1024))));
  if (i === 0) return bytes + " " + sizes[i];
  return (value / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};
