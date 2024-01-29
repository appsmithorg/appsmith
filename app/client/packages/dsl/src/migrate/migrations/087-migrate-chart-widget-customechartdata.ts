import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateChartwidgetCustomEchartConfig = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    const widgetName = widget.widgetName;
    const existingSuffix = `))(${widgetName}.chartType); }}`;
    const replacementSuffix = `))(${widgetName}.chartType) }}`;

    if (
      widget.type === "CHART_WIDGET" &&
      typeof widget.customEChartConfig === "string" &&
      widget.customEChartConfig.endsWith(existingSuffix)
    ) {
      widget.customEChartConfig =
        widget.customEChartConfig.substring(
          0,
          widget.customEChartConfig.lastIndexOf(existingSuffix),
        ) + replacementSuffix;
    }
  });
};
