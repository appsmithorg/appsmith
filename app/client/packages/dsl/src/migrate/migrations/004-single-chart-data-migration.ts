import type { DSLWidget } from "../types";

export const singleChartDataMigration = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "CHART_WIDGET") {
      // Check if chart widget has the deprecated singleChartData property
      if (child.hasOwnProperty("singleChartData")) {
        // This is to make sure that the format of the chartData is accurate
        if (
          Array.isArray(child.singleChartData) &&
          !child.singleChartData[0].hasOwnProperty("seriesName")
        ) {
          child.singleChartData = {
            seriesName: "Series 1",
            data: child.singleChartData || [],
          };
        }

        //TODO: other possibilities?
        child.chartData = JSON.stringify([...child.singleChartData]);
        delete child.singleChartData;
      }
    }

    if (child.children && child.children.length > 0) {
      child = singleChartDataMigration(child);
    }

    return child;
  });

  return currentDSL;
};
