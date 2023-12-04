import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

const GRID_DENSITY_MIGRATION_V1 = 4;

export function migrateInputWidgetsMultiLineInputType(
  currentDSL: DSLWidget,
): DSLWidget {
  if (!currentDSL) return currentDSL;

  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "INPUT_WIDGET_V2") {
      const minInputSingleLineHeight =
        widget.label || widget.tooltip
          ? // adjust height for label | tooltip extra div
            GRID_DENSITY_MIGRATION_V1 + 4
          : // GRID_DENSITY_MIGRATION_V1 used to adjust code as per new scaled canvas.
            GRID_DENSITY_MIGRATION_V1;
      const isMultiLine =
        (widget.bottomRow - widget.topRow) / minInputSingleLineHeight > 1 &&
        widget.inputType === "TEXT";

      if (isMultiLine) {
        widget.inputType = "MULTI_LINE_TEXT";
      }
    }
  });
}
