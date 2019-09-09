export default function snapToGrid(cellSize: number, x: number, y: number) {
  const snappedX = Math.round(x / cellSize) * cellSize
  const snappedY = Math.round(y / cellSize) * cellSize
  return [snappedX, snappedY]
}
