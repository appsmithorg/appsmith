import { emptyChartData, isChartDataValid } from ".";

import { LabelOrientation } from "../constants";
import type { ChartWidgetProps } from ".";
import type { ChartData } from "../constants";
import { RenderModes } from "constants/WidgetConstants";

const seriesData1: ChartData = {
  seriesName: "series1",
  data: [{ x: "x1", y: 1 }],
  color: "series1color",
};
const seriesData2: ChartData = {
  seriesName: "series2",
  data: [{ x: "x1", y: 2 }],
  color: "series2color",
};

const defaultProps: ChartWidgetProps = {
  allowScroll: true,
  showDataPointLabel: true,
  chartData: {
    seriesID1: seriesData1,
    seriesID2: seriesData2,
  },
  chartName: "chart name",
  type: "CHART_WIDGET",
  chartType: "AREA_CHART",
  customFusionChartConfig: { type: "type", dataSource: undefined },
  hasOnDataPointClick: true,
  isVisible: true,
  isLoading: false,
  setAdaptiveYMin: false,
  labelOrientation: LabelOrientation.AUTO,
  onDataPointClick: "",
  widgetId: "widgetID",
  xAxisName: "xaxisname",
  yAxisName: "yaxisname",
  borderRadius: "1",
  boxShadow: "1",
  primaryColor: "primarycolor",
  fontFamily: "fontfamily",
  dimensions: { componentWidth: 11, componentHeight: 11 },
  parentColumnSpace: 1,
  parentRowSpace: 1,
  topRow: 0,
  bottomRow: 0,
  leftColumn: 0,
  rightColumn: 0,
  widgetName: "widgetName",
  version: 1,
  renderMode: RenderModes.CANVAS,
};

describe("emptyChartData", () => {
  describe("when chart type is Echarts", () => {
    it("returns true chartData property is empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";
      props.chartData.seriesID1 = { data: [] };
      props.chartData.seriesID2 = { data: [] };

      expect(emptyChartData(props)).toEqual(true);
    });

    it("returns false chartData property is not empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";
      expect(emptyChartData(props)).toEqual(false);
    });

    it("returns false chartData property if any of the series data is present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";
      props.chartData.seriesID1 = { data: [] };
      expect(emptyChartData(props)).toEqual(false);
    });

    it("returns true if chart data isn't present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";
      props.chartData = null;
      expect(emptyChartData(props)).toEqual(true);

      props.chartData = {
        seriesID1: {},
      };
      expect(emptyChartData(props)).toEqual(true);
    });
  });

  describe("when chart type is custom fusion charts", () => {
    it("returns true if customFusionChartConfig property is empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "CUSTOM_FUSION_CHART";
      props.customFusionChartConfig = {};

      expect(emptyChartData(props)).toEqual(true);
    });

    it("returns false if customFusionChartConfig property is not empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "CUSTOM_FUSION_CHART";
      props.customFusionChartConfig = { key: "value" };

      expect(emptyChartData(props)).toEqual(false);
    });
  });
});

describe("vaidateChartData", () => {
  describe("chart type is CUSTOM_FUSION_CHART", () => {
    it("returns false if customFusionChartConfig is undefined", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "CUSTOM_FUSION_CHART";
      props.customFusionChartConfig = undefined;

      expect(isChartDataValid(props)).toEqual(false);
    });

    it("returns false if customFusionChartConfig is null", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "CUSTOM_FUSION_CHART";
      props.customFusionChartConfig = null;

      expect(isChartDataValid(props)).toEqual(false);
    });

    it("returns true if customFusionChartConfig is present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "CUSTOM_FUSION_CHART";
      props.customFusionChartConfig = {};

      expect(isChartDataValid(props)).toEqual(true);
    });
  });

  describe("chart type is BASIC ECHART", () => {
    it("returns false if series data object is not present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";

      props.chartData = {
        seriesID1: { data: [] },
        seriesID2: undefined,
      };
      expect(isChartDataValid(props)).toEqual(false);

      props.chartData = {
        seriesID1: { data: [] },
        seriesID2: null,
      };
      expect(isChartDataValid(props)).toEqual(false);
    });

    it("returns false if series data object's data field is not present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";

      props.chartData = {
        seriesID1: { data: undefined },
        seriesID2: { data: [] },
      };
      expect(isChartDataValid(props)).toEqual(false);

      props.chartData = {
        seriesID1: { data: null },
        seriesID2: { data: [] },
      };
      expect(isChartDataValid(props)).toEqual(false);
    });

    it("returns true if each series data object's data field is present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";

      props.chartData = {
        seriesID1: { data: [] },
        seriesID2: { data: [] },
      };
      expect(isChartDataValid(props)).toEqual(true);
    });
  });
});
