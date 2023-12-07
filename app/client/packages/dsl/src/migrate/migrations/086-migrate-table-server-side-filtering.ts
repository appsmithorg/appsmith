import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateTableServerSideFiltering = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      widget.enableServerSideFiltering = false;
    }
  });
};
