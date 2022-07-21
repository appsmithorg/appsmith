import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const ChartFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  chartType: "LINE_CHART",
  chartName: "Sales on working days",
  allowScroll: false,
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
  type: "CHART_WIDGET",
  isLoading: false,
  parentColumnSpace: 71.75,
  parentRowSpace: 38,
  leftColumn: 2,
  rightColumn: 8,
  topRow: 1,
  bottomRow: 9,
  parentId: "rglduihhzk",
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Chart${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
