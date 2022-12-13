import { traverseDSLAndMigrate } from "utils/WidgetMigrationUtils";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateInputWidgetShowStepArrows = (
  currentDSL: DSLWidget,
): DSLWidget => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      widget.showStepArrows === undefined &&
      (widget.type === "CURRENCY_INPUT_WIDGET" ||
        (widget.type === "INPUT_WIDGET_V2" &&
          widget.inputType === InputTypes.NUMBER))
    ) {
      widget.showStepArrows = true;
    }
  });
};
