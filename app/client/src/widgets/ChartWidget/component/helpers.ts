import { get } from "lodash";
import type { ChartType, ChartSelectedDataPoint } from "../constants";
import {
  THREE_D_CHART_CONFIGS,
  THREE_D_CHART_SERIES_TYPES,
} from "../constants";
import { omit, cloneDeep } from "lodash";

export const parseOnDataPointClickParams = (evt: any, chartType: ChartType) => {
  switch (chartType) {
    case "CUSTOM_FUSION_CHART": {
      return parseOnDataPointClickForCustomFusionChart(evt);
    }
    case "CUSTOM_ECHART": {
      return parseOnDataPointClickForCustomEChart(evt);
    }
    default: {
      return parseOnDataPointClickForBasicCharts(evt);
    }
  }
};

export const parseOnDataPointClickForCustomEChart = (
  evt: Record<string, unknown>,
): ChartSelectedDataPoint => {
  const rawEventData = omit(cloneDeep(evt), "event");
  return {
    x: undefined,
    y: undefined,
    seriesTitle: undefined,
    rawEventData: rawEventData,
  };
};

export const parseOnDataPointClickForCustomFusionChart = (
  evt: Record<string, unknown>,
): ChartSelectedDataPoint => {
  const data = evt.data as Record<string, unknown>;
  const seriesTitle = get(data, "datasetName", undefined);

  return {
    x: data.categoryLabel,
    y: data.dataValue,
    seriesTitle,
    rawEventData: data,
  } as ChartSelectedDataPoint;
};

export const parseOnDataPointClickForBasicCharts = (
  evt: Record<string, unknown>,
): ChartSelectedDataPoint => {
  const data: unknown[] = evt.data as unknown[];
  const x: unknown = data[0];

  const seriesIndex: number = evt.seriesIndex as number;
  const index = (seriesIndex ?? 0) + 1;
  const y: unknown = data[index];

  const seriesName: string | undefined = evt.seriesName as string;

  return {
    x: x,
    y: y,
    seriesTitle: seriesName,
  } as ChartSelectedDataPoint;
};

export const labelKeyForChart = (
  axisName: "xAxis" | "yAxis",
  chartType: ChartType,
): "x" | "y" => {
  let labelKey: "x" | "y";

  if (axisName == "xAxis") {
    labelKey = chartType == "BAR_CHART" ? "y" : "x";
  } else {
    labelKey = chartType == "BAR_CHART" ? "x" : "y";
  }
  return labelKey;
};

export const getTextWidth = (text: string, font: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) {
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  } else {
    return 0;
  }
}

export const is3DChart = (chartConfig: Record<string, unknown>) => {
  const chartConfigKeys = Object.keys(chartConfig);

  const threeDConfigPresent = chartConfigKeys.some((key) =>
    THREE_D_CHART_CONFIGS.includes(key),
  );
  if (threeDConfigPresent) {
    return true;
  }

  const seriesConfig = chartConfig.series;
  if (Array.isArray(seriesConfig)) {
    return seriesConfig.some((series) => isSeriesConfig3D(series));
  } else {
    return isSeriesConfig3D(seriesConfig);
  }
};

const isSeriesConfig3D = (seriesConfig: unknown) => {
  if (seriesConfig && typeof seriesConfig == "object") {
    const seriesType = (seriesConfig as Record<string, unknown>).type as string;
    return THREE_D_CHART_SERIES_TYPES.includes(seriesType);
  } else {
    return false;
  }
};
