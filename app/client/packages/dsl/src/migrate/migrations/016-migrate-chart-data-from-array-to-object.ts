/* eslint-disable @typescript-eslint/no-explicit-any */
import set from "lodash/set";
import isArray from "lodash/isArray";
import findIndex from "lodash/findIndex";
import type { DSLWidget } from "../types";
import { generateReactKey } from "../utils";

export const migrateChartDataFromArrayToObject = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((children: DSLWidget) => {
    if (children.type === "CHART_WIDGET") {
      if (isArray(children.chartData)) {
        const newChartData = {};
        const dynamicBindingPathList = children?.dynamicBindingPathList
          ? children?.dynamicBindingPathList.slice()
          : [];

        children.chartData.map((datum: any, index: number) => {
          const generatedKey = generateReactKey();

          set(newChartData, `${generatedKey}`, datum);

          if (
            isArray(children.dynamicBindingPathList) &&
            findIndex(
              children.dynamicBindingPathList,
              (path: { key: string }) =>
                path.key === `chartData[${index}].data`,
            ) > -1
          ) {
            const foundIndex = findIndex(
              children.dynamicBindingPathList,
              (path: { key: string }) =>
                path.key === `chartData[${index}].data`,
            );

            dynamicBindingPathList[foundIndex] = {
              key: `chartData.${generatedKey}.data`,
            };
          }
        });

        children.dynamicBindingPathList = dynamicBindingPathList;
        children.chartData = newChartData;
      }
    } else if (
      children.type === "CONTAINER_WIDGET" ||
      children.type === "FORM_WIDGET" ||
      children.type === "CANVAS_WIDGET" ||
      children.type === "TABS_WIDGET"
    ) {
      children = migrateChartDataFromArrayToObject(children);
    }

    return children;
  });

  return currentDSL;
};
