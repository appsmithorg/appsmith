import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateCustomWidgetDynamicHeight = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "CUSTOM_WIDGET" && !widget.dynamicHeight) {
      widget.dynamicHeight = "FIXED";
    }
  });
};
