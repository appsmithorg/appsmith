import Widget from "./widget";
import IconSVG from "./icon.svg";
import { DefaultChartConfigs, defaultChartDataset } from "./constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "ChartWidgetV2", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: [
    "chart",
    "bar",
    "echarts",
    "graph",
    "visuals",
    "visualisations",
    "pie",
    "area",
    "column",
  ],
  defaults: {
    widgetName: "ChartWidgetV2",
    rows: 30,
    columns: 50,
    version: 1,
    isCanvas: false,
    chartConfig: DefaultChartConfigs["COLUMN_CHART"],
    chartType: "COLUMN_CHART",
    chartData: defaultChartDataset,
    customChartData: DefaultChartConfigs["CUSTOM_ECHARTS_CHART"],
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
  },
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "280px",
            minHeight: "300px",
          };
        },
      },
    ],
  },
};

export default Widget;
