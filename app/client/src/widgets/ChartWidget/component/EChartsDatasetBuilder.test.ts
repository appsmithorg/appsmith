import { EChartsDatasetBuilder } from "./EChartsDatasetBuilder";
import type { ChartData, ChartType } from "../constants";

describe("EChartsConfigurationBuilder", () => {
  describe("filteredChartData", () => {
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

    it("1. returns all series data if chart type is not pie", () => {
      const chartType: ChartType = "AREA_CHART";
      const builder = new EChartsDatasetBuilder(chartType, chartData);

      expect(builder.filteredChartData).toEqual(chartData);
    });

    it("2. returns only the first series data if chart type is pie", () => {
      const chartType: ChartType = "PIE_CHART";

      const builder = new EChartsDatasetBuilder(chartType, chartData);
      const expectedOutput = {
        seriesID1: chartData1,
      };

      expect(builder.filteredChartData).toEqual(expectedOutput);
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
      const chartType: ChartType = "LINE_CHART";
      const builder = new EChartsDatasetBuilder(chartType, chartData);

      const expectedChartDataSource = {
        source: [
          ["Category", "seriesID1", "seriesID2", "seriesID3"],
          ["x1", "y1", "", "y3"],
          ["Product1", "", "y2", ""],
        ],
      };

      expect(builder.datasetFromData()).toEqual(expectedChartDataSource);
    });
  });

  describe("longestDataLabels", () => {
    it("returns the x and y values with longest number of characters in chart data", () => {
      const longestXLabel = "longestXLabel";
      const longestYValue = "1234.56";

      const chartData1: ChartData = {
        seriesName: "series1",
        data: [
          { x: "smallLabel", y: "123" },
          { x: longestXLabel, y: "1234" },
        ],
        color: "series1color",
      };

      const chartData2: ChartData = {
        seriesName: "series2",
        data: [
          { x: "largeLabel", y: longestYValue },
          { x: "largerLabel", y: "12" },
        ],
        color: "series2color",
      };

      const chartType: ChartType = "LINE_CHART";

      const builder = new EChartsDatasetBuilder(chartType, {
        series1ID: chartData1,
        series2ID: chartData2,
      });

      builder.datasetFromData();

      expect(builder.longestDataLabels()).toEqual({
        x: longestXLabel,
        y: longestYValue,
      });
    });
  });
});
