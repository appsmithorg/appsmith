import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateAddShowHideDataPointLabels = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type == "CHART_WIDGET") {
      const chartWidgetProps = widget;

      chartWidgetProps.showDataPointLabel = chartWidgetProps.allowScroll;
    }
  });
};
