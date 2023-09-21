import type { DSLWidget } from "./types";
import { traverseDSLAndMigrate } from "./utils";

export function migrateLabelPosition(currentDSL: DSLWidget) {
  return traverseDSLAndMigrate(currentDSL, (widget: DSLWidget) => {
    if (
      (widget.type === "PHONE_INPUT_WIDGET" ||
        widget.type === "CURRENCY_INPUT_WIDGET") &&
      widget.labelPosition === undefined
    ) {
      widget.labelPosition = "Left";
    }
  });
}
