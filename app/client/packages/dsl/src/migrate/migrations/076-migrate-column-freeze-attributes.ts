import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateColumnFreezeAttributes = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget?.primaryColumns;

      // Assign default sticky value to each column
      if (primaryColumns) {
        for (const column in primaryColumns) {
          if (!primaryColumns[column].hasOwnProperty("sticky")) {
            primaryColumns[column].sticky = "";
          }
        }
      }

      widget.canFreezeColumn = false;
      widget.columnUpdatedAt = Date.now();
    }
  });
};
