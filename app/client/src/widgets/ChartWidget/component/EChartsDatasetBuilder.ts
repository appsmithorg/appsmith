import type { AllChartData, ChartType } from "../constants";
import { XAxisCategory } from "../constants";

export class EChartsDatasetBuilder {
  static chartData(
    chartType: ChartType,
    chartData: AllChartData,
  ): AllChartData {
    if (chartType == "PIE_CHART") {
      // return only first series data
      const firstSeriesKey = Object.keys(chartData)[0];
      return { [firstSeriesKey]: chartData[firstSeriesKey] };
    } else {
      return chartData;
    }
  }

  static datasetFromData(allSeriesData: AllChartData) {
    // ["Category", "seriesID1", "seriesID2"]
    const dimensions: string[] = [XAxisCategory];

    // { Product1 : { "series1" : yValue1 }, "series2" : yValue2 }
    const categories: Record<string, Record<string, unknown>> = {};

    Object.keys(allSeriesData).forEach((seriesID) => {
      dimensions.push(seriesID);

      const seriesData = allSeriesData[seriesID];
      const datapoints = seriesData.data;

      for (const datapoint of datapoints) {
        const categoryName = datapoint.x;
        const value = datapoint.y;

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
