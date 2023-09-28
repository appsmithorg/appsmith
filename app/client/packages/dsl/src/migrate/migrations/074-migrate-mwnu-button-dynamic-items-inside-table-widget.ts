import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateMenuButtonDynamicItemsInsideTableWidget = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget.primaryColumns;

      if (primaryColumns) {
        for (const column in primaryColumns) {
          if (
            primaryColumns.hasOwnProperty(column) &&
            primaryColumns[column].columnType === "menuButton" &&
            !primaryColumns[column].menuItemsSource
          ) {
            primaryColumns[column].menuItemsSource = "STATIC";
          }
        }
      }
    }
  });
};
