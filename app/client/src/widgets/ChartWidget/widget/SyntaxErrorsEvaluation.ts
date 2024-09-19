import type { WidgetError } from "widgets/BaseWidget";

import type { ChartWidgetProps } from ".";
import { isBasicEChart } from "../component/helpers";

export function syntaxErrorsFromProps(props: ChartWidgetProps): WidgetError[] {
  if (!props.errors) {
    return [];
  }

  const errors: WidgetError[] = [];

  for (const error of props.errors) {
    if (nonDataError(error)) {
      errors.push(error);
    } else {
      if (
        props.chartType == "CUSTOM_FUSION_CHART" &&
        customFusionChartError(error)
      ) {
        errors.push(error);
      } else if (
        props.chartType == "CUSTOM_ECHART" &&
        customEChartsError(error)
      ) {
        errors.push(error);
      } else if (isBasicEChart(props.chartType) && eChartsError(error)) {
        if (props.chartType == "PIE_CHART") {
          if (pieChartFirstSeriesError(props, error)) {
            errors.push(error);
          }
        } else {
          errors.push(error);
        }
      }
    }
  }

  return errors;
}

const nonDataError = (error: WidgetError) => {
  if (
    eChartsError(error) ||
    customEChartsError(error) ||
    customFusionChartError(error)
  ) {
    return false;
  } else {
    return true;
  }
};

const pieChartFirstSeriesError = (
  props: ChartWidgetProps,
  error: WidgetError,
) => {
  const firstSeriesKey = Object.keys(props.chartData)[0];

  return error.path?.startsWith(`chartData.${firstSeriesKey}`);
};

const customFusionChartError = (error: WidgetError) => {
  return error.path?.startsWith("customFusionChartConfig");
};

const eChartsError = (error: WidgetError) => {
  return error.path?.startsWith("chartData");
};

const customEChartsError = (error: WidgetError) => {
  return error.path?.startsWith("customEChartConfig");
};
