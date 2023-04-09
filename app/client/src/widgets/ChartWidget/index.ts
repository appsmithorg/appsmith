import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";

import { generateReactKey } from "widgets/WidgetUtils";
import { LabelOrientation } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Chart",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["graph", "visuals", "visualisations"],
  defaults: {
    rows: 32,
    columns: 24,
    widgetName: "Chart",
    chartType: "COLUMN_CHART",
    chartName: "Sales Report",
    allowScroll: false,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
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
        chart: {
          caption: "Sales Report",
          xAxisName: "Product Line",
          yAxisName: "Revenue($)",
          theme: "fusion",
          alignCaptionWithCanvas: 1,
          // Caption styling =======================
          captionFontSize: "24",
          captionAlignment: "center",
          captionPadding: "20",
          captionFontColor: Colors.THUNDER,
          // legend position styling ==========
          legendIconSides: "4",
          legendIconBgAlpha: "100",
          legendIconAlpha: "100",
          legendPosition: "top",
          // Canvas styles ========
          canvasPadding: "0",
          // Chart styling =======
          chartLeftMargin: "20",
          chartTopMargin: "10",
          chartRightMargin: "40",
          chartBottomMargin: "10",
          // Axis name styling ======
          xAxisNameFontSize: "14",
          labelFontSize: "12",
          labelFontColor: Colors.DOVE_GRAY2,
          xAxisNameFontColor: Colors.DOVE_GRAY2,

          yAxisNameFontSize: "14",
          yAxisValueFontSize: "12",
          yAxisValueFontColor: Colors.DOVE_GRAY2,
          yAxisNameFontColor: Colors.DOVE_GRAY2,
        },
      },
    },
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
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
