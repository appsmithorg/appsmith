import { EChartsDatasetBuilder } from "./EChartsDatasetBuilder";
import type { ChartData } from "../constants";
import { LabelOrientation } from "../constants";
import type { ChartComponentProps } from ".";

describe("EChartsConfigurationBuilder", () => {
  describe("get chart data", () => {
    const chartData1: ChartData = {
      seriesName: "series1",
      data: [{ x: "x1", y: "y1" }],
      color: "series1color",
    };
    const chartData2: ChartData = {
      seriesName: "series2",
      data: [{ x: "Product1", y: "y2" }],
      color: "series2color",
    };

    const chartData = { seriesID1: chartData1, seriesID2: chartData2 };
    const defaultProps: ChartComponentProps = {
      allowScroll: true,
      showDataPointLabel: true,
      chartData: chartData,
      chartName: "chart name",
      chartType: "AREA_CHART",
      customEChartConfig: {},
      customFusionChartConfig: { type: "type", dataSource: undefined },
      hasOnDataPointClick: true,
      isVisible: true,
      isLoading: false,
      setAdaptiveYMin: false,
      labelOrientation: LabelOrientation.AUTO,
      onDataPointClick: (point) => {
        return point;
      },
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
    };

    it("1. returns all series data if chart type is not pie", () => {
      const output = EChartsDatasetBuilder.chartData(
        defaultProps.chartType,
        defaultProps.chartData,
      );
      expect(output).toEqual(chartData);
    });

    it("2. returns only the first series data if chart type is pie", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "PIE_CHART";
      const output = EChartsDatasetBuilder.chartData(
        props.chartType,
        props.chartData,
      );
      const expectedOutput = {
        seriesID1: chartData1,
      };
      expect(output).toEqual(expectedOutput);
    });
  });

  describe("datasetFromData", () => {
    it("builds the right chart data source from chart widget props", () => {
      const chartData1: ChartData = {
        seriesName: "series1",
        data: [{ x: "x1", y: "y1" }],
        color: "series1color",
      };
      const chartData2: ChartData = {
        seriesName: "series2",
        data: [{ x: "Product1", y: "y2" }],
        color: "series2color",
      };

      const chartData3: ChartData = {
        seriesName: "series3",
        data: [{ x: "x1", y: "y3" }],
        color: "series2color",
      };

      const chartData = {
        seriesID1: chartData1,
        seriesID2: chartData2,
        seriesID3: chartData3,
      };
      const chartDataSource = EChartsDatasetBuilder.datasetFromData(chartData);

      const expectedChartDataSource = {
        source: [
          ["Category", "seriesID1", "seriesID2", "seriesID3"],
          ["x1", "y1", "", "y3"],
          ["Product1", "", "y2", ""],
        ],
      };
      expect(chartDataSource).toEqual(expectedChartDataSource);
    });
  });
});
