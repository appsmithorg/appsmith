import type { AllChartData, ChartType, LongestLabelParams } from "../constants";
import { XAxisCategory } from "../constants";

export class EChartsDatasetBuilder {
  chartDataProp: AllChartData;
  chartType: ChartType;
  filteredChartData: AllChartData;

  maxXLabelString = "";
  maxXLabelLength = 0;

  maxYLabelString = "";
  maxYLabelLength = 0;

  constructor(chartType: ChartType, chartDataProp: AllChartData) {
    this.chartDataProp = chartDataProp;
    this.chartType = chartType;
    this.filteredChartData = this.filterChartData();
  }

  longestDataLabels(): LongestLabelParams {
    return {
      x: this.maxXLabelString,
      y: this.maxYLabelString,
    };
  }

  filterChartData(): AllChartData {
    if (this.chartType == "PIE_CHART") {
      // return only first series data
      const firstSeriesKey = Object.keys(this.chartDataProp)[0];

      return { [firstSeriesKey]: this.chartDataProp[firstSeriesKey] };
    } else {
      return this.chartDataProp;
    }
  }

  checkForLongestLabel(x: number | string, y: number | string) {
    const xString = x.toString();

    // This is needed to correctly calculate the width of the y label.
    const yString = y.toLocaleString();

    if (xString.length > this.maxXLabelLength) {
      this.maxXLabelLength = xString.length;
      this.maxXLabelString = xString;
    }

    if (yString.length > this.maxYLabelLength) {
      this.maxYLabelLength = yString.length;
      this.maxYLabelString = yString;
    }
  }

  datasetFromData() {
    // ["Category", "seriesID1", "seriesID2"]
    const dimensions: string[] = [XAxisCategory];

    // { Product1 : { "series1" : yValue1 }, "series2" : yValue2 }
    const categories: Record<string, Record<string, unknown>> = {};

    Object.keys(this.filteredChartData).forEach((seriesID) => {
      dimensions.push(seriesID);

      const seriesData = this.filteredChartData[seriesID];
      const datapoints = seriesData.data;

      for (const datapoint of datapoints) {
        const categoryName = datapoint.x;
        const value = datapoint.y;

        this.checkForLongestLabel(categoryName, value);

        if (!categories[categoryName]) {
          categories[categoryName] = {};
        }

        categories[categoryName][seriesID] = value;
      }
    });

    const chartDatasource: unknown[] = [dimensions];

    Object.keys(categories).forEach((categoryName) => {
      const values = categories[categoryName];

      const categoryDatapoints: unknown[] = [];

      categoryDatapoints.push(categoryName);

      for (let i = 1; i < dimensions.length; i++) {
        if (values.hasOwnProperty(dimensions[i])) {
          categoryDatapoints.push(values[dimensions[i]]);
        } else {
          // datapoint doesn't exist for this category and series, so push empty value
          categoryDatapoints.push("");
        }
      }

      chartDatasource.push(categoryDatapoints);
    });

    return { source: chartDatasource };
  }
}
