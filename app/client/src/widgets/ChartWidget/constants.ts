import { Colors } from "constants/Colors";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

export type ChartType =
  | "LINE_CHART"
  | "BAR_CHART"
  | "PIE_CHART"
  | "COLUMN_CHART"
  | "AREA_CHART"
  | "SCATTER_CHART"
  | "CUSTOM_ECHART"
  | "CUSTOM_FUSION_CHART";

export const XAxisCategory = "Category";
export interface ChartDataPoint {
  x: any;
  y: any;
}

export interface ChartData {
  seriesName?: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface CustomFusionChartConfig {
  type: string;
  dataSource?: any;
}

export interface AllChartData {
  [key: string]: ChartData;
}

export interface ChartSelectedDataPoint {
  x: unknown | undefined;
  y: unknown | undefined;
  seriesTitle: string | undefined;
  rawEventData?: Record<string, unknown>;
}

export const messages = {
  ErrorTitle: "Error in Chart Data/Configuration",
  MoreDetails: "More Details",
  EmptyData: "No chart data to display",
  Undefined: "Undefined",
  customFusionChartDeprecationMessage:
    "Custom Fusion Charts will stop being supported on March 1st 2024. Change the chart type to E-charts Custom to switch.",
  customFusionChartOptionLabel: (showDeprecationMessage: boolean) => {
    return showDeprecationMessage
      ? "Custom Fusion Charts (deprecated)"
      : "Custom Fusion Charts";
  },
};

export const CUSTOM_ECHART_FEATURE_FLAG =
  FEATURE_FLAG["release_enable_custom_echarts"];

export const FUSION_CHART_DEPRECATION_FLAG =
  FEATURE_FLAG["release_show_custom_fusion_chart_deprecation_message"];

export const CUSTOM_CHART_TYPES = [
  "area2d",
  "bar2d",
  "bar3d",
  "boxandwhisker2d",
  "candlestick",
  "chord",
  "dragnode",
  "dragarea",
  "dragcolumn2d",
  "dragline",
  "errorbar2d",
  "errorline",
  "errorscatter",
  "funnel",
  "gantt",
  "heatmap",
  "hbullet",
  "hled",
  "InverseMSArea",
  "InverseMSColumn2D",
  "InverseMSLine",
  "LogMSColumn2D",
  "LogMSLine",
  "MultiAxisLine",
  "multilevelpie",
  "overlappedcolumn2d",
  "overlappedbar2d",
  "pyramid",
  "radar",
  "angulargauge",
  "realtimearea",
  "bulb",
  "realtimecolumn",
  "cylinder",
  "hlineargauge",
  "realtimeline",
  "realtimelinedy",
  "realtimestackedarea",
  "realtimestackedcolumn",
  "thermometer",
  "sankey",
  "selectscatter",
  "sparkcolumn",
  "sparkline",
  "sparkwinloss",
  "msstepline",
  "sunburst",
  "treemap",
  "vbullet",
  "vled",
  "waterfall2d",
  "zoomline",
  "zoomlinedy",
  "zoomscatter",
  "column2d",
  "column3d",
  "line",
  "area",
  "bar2d",
  "bar3d",
  "pie2d",
  "pie3d",
  "doughnut2d",
  "doughnut3d",
  "pareto2d",
  "pareto3d",
  "scrollcombidy2d",
  "scrollcombi2d",
  "scrollstackedcolumn2d",
  "scrollmsstackedcolumn2d",
  "scrollmsstackedcolumn2dlinedy",
  "scrollstackedbar2d",
  "scrollarea2d",
  "scrollline2d",
  "scrollcolumn2d",
  "scrollbar2d",
  "bubble",
  "scatter",
  "msstackedcolumn2d",
  "stackedarea2d",
  "stackedbar3d",
  "stackedbar2d",
  "stackedcolumn3d",
  "stackedcolumn2d",
  "msstackedcolumn2dlinedy",
  "stackedcolumn3dlinedy",
  "mscolumn3dlinedy",
  "mscombidy2d",
  "mscombidy3d",
  "stackedcolumn3dline",
  "stackedcolumn2dline",
  "mscolumnline3d",
  "mscombi3d",
  "mscombi2d",
  "marimekko",
  "MSArea",
  "msbar3d",
  "msbar2d",
  "msline",
  "mscolumn3d",
  "mscolumn2d",
  "spline",
  "splinearea",
  "msspline",
  "mssplinedy",
  "mssplinearea",
  "stackedcolumn2dlinedy",
  "stackedarea2dlinedy",
];

export enum LabelOrientation {
  AUTO = "auto",
  SLANT = "slant",
  ROTATE = "rotate",
  STAGGER = "stagger",
}

export const LABEL_ORIENTATION_COMPATIBLE_CHARTS = [
  "LINE_CHART",
  "AREA_CHART",
  "COLUMN_CHART",
];

export const DefaultEChartConfig = {
  dataset: {
    source: [
      ["product", "2012", "2013", "2014", "2015", "2016", "2017"],
      ["Milk Tea", 56.5, 82.1, 88.7, 70.1, 53.4, 85.1],
      ["Matcha Latte", 51.1, 51.4, 55.1, 53.3, 73.8, 68.7],
      ["Cheese Cocoa", 40.1, 62.2, 69.5, 36.4, 45.2, 32.5],
      ["Walnut Brownie", 25.2, 37.1, 41.2, 18, 33.9, 49.1],
    ],
  },
  legend: {},
  tooltip: {
    trigger: "axis",
    showContent: false,
  },
  xAxis: { type: "category" },
  yAxis: { gridIndex: 0 },
  grid: { top: "55%" },
  series: [
    {
      type: "line",
      smooth: true,
      seriesLayoutBy: "row",
      emphasis: { focus: "series" },
    },
    {
      type: "line",
      smooth: true,
      seriesLayoutBy: "row",
      emphasis: { focus: "series" },
    },
    {
      type: "line",
      smooth: true,
      seriesLayoutBy: "row",
      emphasis: { focus: "series" },
    },
    {
      type: "line",
      smooth: true,
      seriesLayoutBy: "row",
      emphasis: { focus: "series" },
    },
    {
      type: "pie",
      id: "pie",
      radius: "30%",
      center: ["50%", "25%"],
      emphasis: {
        focus: "self",
      },
      label: {
        formatter: "{b}: {@2012} ({d}%)",
      },
      encode: {
        itemName: "product",
        value: "2012",
        tooltip: "2012",
      },
    },
  ],
};

export const DefaultEChartsBasicChartsData = {
  seriesName: "2023",
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
};

export const DefaultFusionChartConfig = {
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
};
