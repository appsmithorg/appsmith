import isString from "lodash/isString";
import type { DSLWidget } from "../types";

export const migrateOldChartData = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "CHART_WIDGET") {
    if (isString(currentDSL.chartData)) {
      try {
        currentDSL.chartData = JSON.parse(currentDSL.chartData);
      } catch (error) {
        // Sentry.captureException({
        //   message: "Chart Migration F`ailed",
        //   oldData: currentDSL.chartData,
        // });
        currentDSL.chartData = [];
      }
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(migrateOldChartData);
  }

  return currentDSL;
};
