import { get } from "lodash";
import type { ChartType, ChartSelectedDataPoint } from "../constants";
import { omit, cloneDeep } from "lodash";

export const parseOnDataPointClickParams = (evt: any, chartType: ChartType) => {
  //console.log("***", "chart type is ", chartType, " event is ", evt)
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
