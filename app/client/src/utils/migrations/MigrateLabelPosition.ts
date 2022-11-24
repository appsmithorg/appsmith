import { LabelPosition } from "components/constants";
import { traverseDSLAndMigrate } from "utils/WidgetMigrationUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export function migrateLabelPosition(currentDSL: DSLWidget) {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      (widget.type === "PHONE_INPUT_WIDGET" ||
        widget.type === "CURRENCY_INPUT_WIDGET") &&
      widget.labelPosition === undefined
    ) {
      widget.labelPosition = LabelPosition.Left;
    }
  });
}
