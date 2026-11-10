import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateTableWidgetV2DynamicHeight = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2" && !widget.dynamicHeight) {
      widget.dynamicHeight = "FIXED";
    }
  });
};
