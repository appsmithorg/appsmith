import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { generateReactKey } from "widgets/WidgetUtils";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Chart",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 8 * GRID_DENSITY_MIGRATION_V1,
    columns: 6 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Chart",
    chartType: "LINE_CHART",
    chartName: "Last week's revenue",
    allowHorizontalScroll: false,
    version: 1,
    chartData: {
      [generateReactKey()]: {
        seriesName: "Sales",
        data: [
          {
            x: "Mon",
            y: 10000,
          },
          {
            x: "Tue",
            y: 12000,
          },
          {
            x: "Wed",
            y: 32000,
          },
          {
            x: "Thu",
            y: 28000,
          },
          {
            x: "Fri",
            y: 14000,
          },
          {
            x: "Sat",
            y: 19000,
          },
          {
            x: "Sun",
            y: 36000,
          },
        ],
      },
    },
    xAxisName: "Last Week",
    yAxisName: "Total Order Revenue $",
    customFusionChartConfig: {
      type: "column2d",
      dataSource: {
        chart: {
          caption: "Last week's revenue",
          xAxisName: "Last Week",
          yAxisName: "Total Order Revenue $",
          theme: "fusion",
        },
        data: [
          {
            label: "Mon",
            value: 10000,
          },
          {
            label: "Tue",
            value: 12000,
          },
          {
            label: "Wed",
            value: 32000,
          },
          {
            label: "Thu",
            value: 28000,
          },
          {
            label: "Fri",
            value: 14000,
          },
          {
            label: "Sat",
            value: 19000,
          },
          {
            label: "Sun",
            value: 36000,
          },
        ],
        trendlines: [
          {
            line: [
              {
                startvalue: "38000",
                valueOnRight: "1",
                displayvalue: "Weekly Target",
              },
            ],
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
