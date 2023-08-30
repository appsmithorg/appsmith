import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "WidgetProvider/constants";
import type { ChartWidgetProps } from "widgets/ChartWidget/widget";
import { LabelOrientation } from "widgets/ChartWidget/constants";
import { traverseDSLAndMigrate } from "utils/WidgetMigrationUtils";

const DefaultEChartConfig = {
  dataset: {
    source: [
      ["Day", "Baidu", "Google", "Bing"],
      ["Mon", 620, 120, 60],
      ["Tue", 732, 132, 72],
      ["Wed", 701, 101, 71],
      ["Thu", 734, 134, 74],
      ["Fri", 1090, 290, 190],
      ["Sat", 1130, 230, 130],
      ["Sun", 1120, 220, 110],
    ],
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  title: {
    text: "Search Engine Usage",
    left: "center",
    textStyle: {
      width: 200,
      overflow: "truncate",
    },
  },
  legend: {
    top: 40,
    type: "scroll",
  },
  grid: {
    left: 15,
    right: 15,
    bottom: 30,
    top: 100,
    containLabel: true,
  },
  xAxis: [
    {
      type: "category",
    },
  ],
  yAxis: [
    {
      type: "value",
    },
  ],
  series: [
    {
      type: "bar",
      stack: "Search Engine",
    },
    {
      type: "bar",
      stack: "Search Engine",
    },
    {
      type: "bar",
      stack: "Search Engine",
    },
  ],
};

export const migrateChartWidgetLabelOrientationStaggerOption = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type == "CHART_WIDGET") {
      const chartWidgetProps = widget as ChartWidgetProps;
      if (chartWidgetProps.labelOrientation == LabelOrientation.STAGGER) {
        chartWidgetProps.labelOrientation = LabelOrientation.AUTO;
      }
    }
  });
};

export const migrateAddShowHideDataPointLabels = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type == "CHART_WIDGET") {
      const chartWidgetProps = widget as ChartWidgetProps;
      chartWidgetProps.showDataPointLabel = chartWidgetProps.allowScroll;
    }
  });
};

export const migrateDefaultValuesForCustomEChart = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type == "CHART_WIDGET") {
      const chartWidgetProps = widget as ChartWidgetProps;
      chartWidgetProps.customEChartConfig = DefaultEChartConfig;
    }
  });
};
