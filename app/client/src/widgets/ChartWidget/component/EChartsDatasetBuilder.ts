import type { ChartComponentProps } from ".";
import type { ChartData } from "../constants";

export class EChartsDatasetBuilder {
  static chartData(props: ChartComponentProps) {
    if (props.chartType == "PIE_CHART") {
      return Object.values(props.chartData).slice(0, 1);
    } else {
      return Object.values(props.chartData);
    }
  }

  static datasetFromData(xAxisName: string, allSeriesData: ChartData[]) {
    const xAxisDimension: string =
      xAxisName.length > 0 ? xAxisName : "Category";

    const dimensions = [xAxisDimension];
    const sourceObject: Record<string, any> = {};

    for (const data of allSeriesData) {
      const seriesName = data.seriesName ?? "";
      const seriesData = data.data;

      for (const dataPoint of seriesData) {
        const categoryName = dataPoint.x;
        const value = dataPoint.y;

        if (!sourceObject[categoryName]) {
          sourceObject[categoryName] = { [xAxisDimension]: categoryName };
        }

        sourceObject[categoryName][seriesName] = value;
      }

      dimensions.push(seriesName);
    }
    const sources = [];
    for (const categoryName in sourceObject) {
      sources.push(sourceObject[categoryName]);
    }
    return {
      dimensions: dimensions,
      source: sources,
    };
  }
}
