import type { WidgetError } from "widgets/BaseWidget";

import type { ChartWidgetProps } from ".";

export function syntaxErrorsFromProps(props: ChartWidgetProps): WidgetError[] {
  if (!props.errors || props.errors.length == 0) {
    return [];
  }

  const errors: WidgetError[] = [];
  props.errors.forEach((error) => {
    if (nonDataError(error)) {
      errors.push(error);
    } else {
      if (props.chartType == "CUSTOM_FUSION_CHART") {
        if (customFusionChartError(error)) {
          errors.push(error);
        }
      } else {
        if (eChartsError(error)) {
          if (props.chartType == "PIE_CHART") {
            const firstSeriesKey = Object.keys(props.chartData)[0];
            if (
              error.path &&
              error.path.startsWith(`chartData.${firstSeriesKey}`)
            ) {
              errors.push(error);
            }
          } else {
            errors.push(error);
          }
        }
      }
    }
  });
  return errors;
}

const nonDataError = (error: WidgetError) => {
  if (eChartsError(error)) {
    return false;
  } else if (customFusionChartError(error)) {
    return false;
  } else {
    return true;
  }
};

const customFusionChartError = (error: WidgetError) => {
  return error.path && error.path.startsWith("customFusionChartConfig");
};

const eChartsError = (error: WidgetError) => {
  return error.path && error.path.startsWith("chartData");
};
