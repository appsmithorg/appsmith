import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateInputWidgetShowStepArrows = (
  currentDSL: DSLWidget,
): DSLWidget => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      (widget.type === "CURRENCY_INPUT_WIDGET" ||
        (widget.type === "INPUT_WIDGET_V2" && widget.inputType === "NUMBER")) &&
      widget.showStepArrows === undefined
    ) {
      widget.showStepArrows = true;
    }
  });
};
