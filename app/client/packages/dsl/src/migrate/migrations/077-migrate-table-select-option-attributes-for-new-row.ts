/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnPropertiesV2, DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateTableSelectOptionAttributesForNewRow = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget?.primaryColumns as ColumnPropertiesV2;

      // Set default value for allowSameOptionsInNewRow
      if (primaryColumns) {
        Object.values(primaryColumns).forEach((column: any) => {
          if (
            column.hasOwnProperty("columnType") &&
            column.columnType === "select"
          ) {
            column.allowSameOptionsInNewRow = true;
          }
        });
      }
    }
  });
};
