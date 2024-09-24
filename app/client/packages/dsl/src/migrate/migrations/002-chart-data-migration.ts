import type { DSLWidget } from "../types";

export const chartDataMigration = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((children: DSLWidget) => {
    if (
      children.type === "CHART_WIDGET" &&
      children.chartData &&
      children.chartData.length &&
      !Array.isArray(children.chartData[0])
    ) {
      children.chartData = [{ data: children.chartData }];
    } else if (
      children.type === "CONTAINER_WIDGET" ||
      children.type === "FORM_WIDGET" ||
      children.type === "CANVAS_WIDGET" ||
      children.type === "TABS_WIDGET"
    ) {
      children = chartDataMigration(children);
    }

    return children;
  });

  return currentDSL;
};
