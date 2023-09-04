import { get } from "lodash";
import type { ChartType, ChartSelectedDataPoint } from "../constants";
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
  const threeDConfigs = [
    "globe",
    "geo3D",
    "mapbox3D",
    "grid3D",
    "xAxis3D",
    "yAxis3D",
    "zAxis3D",
  ];

  const keys = Object.keys(chartConfig);

  for (const key of keys) {
    if (threeDConfigs.includes(key)) {
      return true;
    }
  }

  const seriesConfig = chartConfig.series;
  if (Array.isArray(seriesConfig)) {
    const filtered3DSeriesTypes = seriesConfig.filter((series) => {
      return isSeriesConfig3D(series);
    });
    return filtered3DSeriesTypes.length > 0;
  } else {
    return isSeriesConfig3D(seriesConfig);
  }
};

const isSeriesConfig3D = (seriesConfig: unknown) => {
  const threeDSeriesTypes = [
    "scatter3D",
    "bar3D",
    "line3D",
    "lines3D",
    "map3D",
    "surface",
    "polygons3D",
    "scatterGL",
    "graphGL",
    "flowGL",
  ];

  if (typeof seriesConfig == "object") {
    const seriesType = (seriesConfig as Record<string, unknown>).type as string;
    return threeDSeriesTypes.includes(seriesType);
  } else {
    return false;
  }
};
