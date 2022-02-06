import { generateReactKey } from "widgets/WidgetUtils";
import { LabelOrientation } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Chart",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 32,
    columns: 24,
    widgetName: "Chart",
    chartType: "COLUMN_CHART",
    chartName: "Sales Report",
    allowScroll: false,
    version: 1,
    animateLoading: true,
    chartData: {
      [generateReactKey()]: {
        seriesName: "Sales",
        data: [
          {
            x: "Product1",
            y: 20000,
          },
          {
            x: "Product2",
            y: 22000,
          },
          {
            x: "Product3",
            y: 32000,
          },
        ],
      },
    },
    xAxisName: "Product Line",
    yAxisName: "Revenue($)",
    labelOrientation: LabelOrientation.AUTO,
    customFusionChartConfig: {
      type: "column2d",
      dataSource: {
        chart: {
          caption: "Sales Report",
          xAxisName: "Product Line",
          yAxisName: "Revenue($)",
          theme: "fusion",
        },
        data: [
          {
            label: "Product1",
            value: 20000,
          },
          {
            label: "Product2",
            value: 22000,
          },
          {
            label: "Product3",
            value: 32000,
          },
        ],
      },
    },
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
