import { GridDefaults } from "constants/WidgetConstants";

export const heightToRows = (height: number) =>
  Math.floor(height / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);

export const getSnappedValues = (
  x: number,
  y: number,
  snapGrid: { x: number; y: number },
) => {
  return {
    x: Math.round(x / snapGrid.x) * snapGrid.x,
    y: Math.round(y / snapGrid.y) * snapGrid.y,
  };
};
