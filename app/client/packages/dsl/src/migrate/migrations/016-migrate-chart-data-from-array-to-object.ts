/* eslint-disable @typescript-eslint/no-explicit-any */
import { set, isArray } from "lodash";
import type { DSLWidget } from "../types";
import { generateReactKey } from "../utils";

/**
 * changes chartData which we were using as array. now it will be a object
 *
 *
 * @param currentDSL
 * @returns
 */
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
            children.dynamicBindingPathList?.findIndex(
              (path: { key: string }) =>
                (path.key = `chartData[${index}].data`),
            ) > -1
          ) {
            const foundIndex = children.dynamicBindingPathList.findIndex(
              (path: { key: string }) =>
                (path.key = `chartData[${index}].data`),
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
