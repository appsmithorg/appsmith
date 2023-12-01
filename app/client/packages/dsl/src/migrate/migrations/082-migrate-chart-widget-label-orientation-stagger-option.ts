import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateChartWidgetLabelOrientationStaggerOption = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type == "CHART_WIDGET") {
      const chartWidgetProps = widget;
      if (chartWidgetProps.labelOrientation == "stagger") {
        chartWidgetProps.labelOrientation = "auto";
      }
    }
  });
};
