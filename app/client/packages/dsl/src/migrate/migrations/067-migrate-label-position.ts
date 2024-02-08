import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export function migrateLabelPosition(currentDSL: DSLWidget) {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      (widget.type === "PHONE_INPUT_WIDGET" ||
        widget.type === "CURRENCY_INPUT_WIDGET") &&
      widget.labelPosition === undefined
    ) {
      widget.labelPosition = "Left";
    }
  });
}
