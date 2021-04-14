import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Chart",
  iconSVG: IconSVG,
  defaults: {
    rows: 8,
    columns: 6,
    widgetName: "Chart",
    chartType: "LINE_CHART",
    chartName: "Sales on working days",
    allowHorizontalScroll: false,
    version: 1,
    chartData: [
      {
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
    ],
    xAxisName: "Last Week",
    yAxisName: "Total Order Revenue $",
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
