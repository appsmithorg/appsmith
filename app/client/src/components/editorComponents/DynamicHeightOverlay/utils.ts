import { GridDefaults } from "constants/WidgetConstants";

export const heightToRows = (height: number) =>
  Math.floor(height / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
