import { emptyChartData } from ".";
import ChartWidget from ".";
import { LabelOrientation } from "../constants";
import type { ChartWidgetProps } from ".";
import type { ChartData } from "../constants";
import { RenderModes } from "constants/WidgetConstants";

describe("emptyChartData", () => {
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
    customEChartConfig: {},
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

  describe("font family", () => {
    expect(ChartWidget.fontFamily).toEqual("Nunito Sans");
  });

  describe("when chart type is basic ECharts", () => {
    const basicEChartProps = JSON.parse(JSON.stringify(defaultProps));
    const basicEChartsType = "LINE_CHART";

    basicEChartProps.chartType = basicEChartsType;

    it("returns true if each series data is absent", () => {
      const props = JSON.parse(JSON.stringify(basicEChartProps));

      props.chartData.seriesID1 = { data: [] };
      props.chartData.seriesID2 = { data: [] };

      expect(emptyChartData(props)).toEqual(true);
    });

    it("returns true if each series is null or undefined", () => {
      const props = JSON.parse(JSON.stringify(basicEChartProps));

      props.chartData.seriesID1 = { data: undefined };
      props.chartData.seriesID2 = { data: null };

      expect(emptyChartData(props)).toEqual(true);
    });

    it("returns true if no series is present", () => {
      const props = JSON.parse(JSON.stringify(basicEChartProps));

      props.chartData = {};
      expect(emptyChartData(props)).toEqual(true);
    });

    it("returns false if all series data are present", () => {
      const props = JSON.parse(JSON.stringify(basicEChartProps));

      expect(emptyChartData(props)).toEqual(false);
    });

    it("returns false if any of the series data is present", () => {
      const props = JSON.parse(JSON.stringify(basicEChartProps));

      props.chartData.seriesID1 = { data: [] };
      expect(emptyChartData(props)).toEqual(false);
    });

    describe("when chart type is pie chart", () => {
      const pieChartProps = JSON.parse(JSON.stringify(defaultProps));

      pieChartProps.chartType = "PIE_CHART";

      it("returns true if first series data is empty", () => {
        const props = JSON.parse(JSON.stringify(pieChartProps));

        props.chartData = { seriesID1: { data: [] } };

        expect(emptyChartData(props)).toEqual(true);
      });

      it("returns true if first series data is empty but second series data is present", () => {
        const props = JSON.parse(JSON.stringify(pieChartProps));

        props.chartData.seriesID1 = { data: [] };
        props.chartData.seriesID2 = { data: { x: "x1", y: 2 } };

        expect(emptyChartData(props)).toEqual(true);
      });
    });
  });

  describe("when chart type is custom fusion charts", () => {
    const customFusionChartProps = JSON.parse(JSON.stringify(defaultProps));

    customFusionChartProps.chartType = "CUSTOM_FUSION_CHART";

    it("returns true if customFusionChartConfig property is empty", () => {
      const props = JSON.parse(JSON.stringify(customFusionChartProps));

      props.customFusionChartConfig = {};

      expect(emptyChartData(props)).toEqual(true);
    });

    it("returns false if customFusionChartConfig property is not empty", () => {
      const props = JSON.parse(JSON.stringify(customFusionChartProps));

      props.chartType = "CUSTOM_FUSION_CHART";
      props.customFusionChartConfig = { key: "value" };

      expect(emptyChartData(props)).toEqual(false);
    });
  });

  describe("when chart type is custom echarts", () => {
    const customEChartsProps = JSON.parse(JSON.stringify(defaultProps));

    customEChartsProps.chartType = "CUSTOM_ECHART";

    it("returns true if customEChartConfig property is empty", () => {
      const props = JSON.parse(JSON.stringify(customEChartsProps));

      props.customEChartConfig = {};

      expect(emptyChartData(props)).toEqual(true);
    });

    it("returns false if customEChartConfig property is not empty", () => {
      const props = JSON.parse(JSON.stringify(customEChartsProps));

      props.customEChartConfig = { key: "value" };

      expect(emptyChartData(props)).toEqual(false);
    });
  });

  describe("Widget Callouts", () => {
    it("returns custom fusion chart deprecation notice when chart type is custom fusion chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "CUSTOM_FUSION_CHART";

      const { getEditorCallouts } = ChartWidget.getMethods();

      const messages = getEditorCallouts(props);

      expect(messages.length).toEqual(1);

      const deprecationMessage = messages[0];

      expect(deprecationMessage.message).toEqual(
        "Custom Fusion Charts will stop being supported on March 1st 2024. Change the chart type to E-charts Custom to switch.",
      );
      expect(deprecationMessage.links).toEqual([
        {
          text: "Learn more",
          url: "https://www.appsmith.com/blog/deprecating-fusion-charts",
        },
      ]);
    });

    it("returns no callouts when chart type isn't custom fusion charts", () => {
      let props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "LINE_CHART";

      const { getEditorCallouts } = ChartWidget.getMethods();

      let messages = getEditorCallouts(props);

      expect(messages.length).toEqual(0);

      props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "CUSTOM_ECHART";

      messages = getEditorCallouts(props);
      expect(messages.length).toEqual(0);
    });
  });
});
