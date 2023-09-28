import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export function migrateSelectWidgetOptionToSourceData(currentDSL: DSLWidget) {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      ["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"].includes(widget.type) &&
      widget.options
    ) {
      widget.sourceData = widget.options;
      widget.optionLabel = "label";
      widget.optionValue = "value";

      delete widget.options;
    }
  });
}
