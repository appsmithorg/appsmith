import { get } from "lodash";
import type { ChartType, ChartSelectedDataPoint } from "../constants";
import { omit, cloneDeep } from "lodash";
import type { ChartComponentProps } from ".";
import { EChartsDatasetBuilder } from "./EChartsDatasetBuilder";
import { EChartsConfigurationBuilder } from "./EChartsConfigurationBuilder";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
};

export const getBasicEChartOptions = (props: ChartComponentProps) => {
  const datasetBuilder = new EChartsDatasetBuilder(
    props.chartType,
    props.chartData,
  );
  const dataset = datasetBuilder.datasetFromData();
  const echartsConfigurationBuilder = new EChartsConfigurationBuilder();

  const options = {
    ...echartsConfigurationBuilder.prepareEChartConfig(
      props,
      datasetBuilder.filteredChartData,
      datasetBuilder.longestDataLabels(),
    ),
    dataset: {
      ...dataset,
    },
  };
  return options;
};

export const chartOptions = (
  chartType: ChartType,
  props: ChartComponentProps,
) => {
  if (isCustomEChart(chartType)) {
    return props.customEChartConfig;
  } else if (isBasicEChart(chartType)) {
    return getBasicEChartOptions(props);
  } else {
    return {};
  }
};

export const dataClickCallbackHelper = (
  params: echarts.ECElementEvent,
  props: ChartComponentProps,
  chartType: ChartType,
) => {
  const dataPointClickParams = parseOnDataPointClickParams(params, chartType);

  props.onDataPointClick(dataPointClickParams);
};

export const isBasicEChart = (type: ChartType) => {
  const types: ChartType[] = [
    "AREA_CHART",
    "PIE_CHART",
    "LINE_CHART",
    "BAR_CHART",
    "COLUMN_CHART",
  ];
  return types.includes(type);
};

export const isCustomFusionChart = (type: ChartType) => {
  return type == "CUSTOM_FUSION_CHART";
};

export const isCustomEChart = (type: ChartType) => {
  return type == "CUSTOM_ECHART";
};
