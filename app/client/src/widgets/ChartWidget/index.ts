import { Colors } from "constants/Colors";
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
    xAxisNameFontSize: "16",
    yAxisNameFontSize: "16",
    xAxisNameColor: "#be185d",
    yAxisNameColor: "#be185d",
    xAxisValueColor: "#cacaca",
    yAxisValueColor: "#cacaca",
    captionPadding: "15",
    captionFontSize: "30",
    captionAlignment: "left",
    canvasPadding: "60, 0, 60, 10",
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
          captionAlignment: "left",
          alignCaptionWithCanvas: 0,
          // Caption styling =======================
          captionFontSize: "30",
          captionFontColor: Colors.CODE_GRAY,
          // legend position styling ==========
          legendIconSides: "4",
          legendIconBgAlpha: "100",
          legendIconAlpha: "100",
          legendPosition: "top",
          captionPadding: "15",
          // Canvas styles ========
          canvasTopPadding: "0",
          canvasLeftPadding: "60",
          canvasRightPadding: "60",
          canvasBottomPadding: "10",
          // Chart styling =======
          chartBottomMargin: "15",
          // Axis name styling ======
          xAxisNameFontSize: "16",
          xAxisValueFontColor: Colors.DOVE_GRAY2,
          yAxisNameFontSize: "16",
          yAxisValueFontColor: Colors.DOVE_GRAY2,
          // Base configurations ======
          // bgColor: Colors.WHITE,
          // setAdaptiveYMin: this.props.setAdaptiveYMin ? "1" : "0",
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
