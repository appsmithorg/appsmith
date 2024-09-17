/* eslint-disable @typescript-eslint/no-explicit-any */
import set from "lodash/set";
import type { DSLWidget } from "../types";

/**
 * adds 'privateWidgets' key for all list widgets
 *
 * @param currentDSL
 * @returns
 */
export const addPrivateWidgetsToAllListWidgets = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "LIST_WIDGET") {
      const privateWidgets: any = {};

      Object.keys(child.template).forEach((entityName) => {
        privateWidgets[entityName] = true;
      });

      if (!child.privateWidgets) {
        set(child, `privateWidgets`, privateWidgets);
      }
    }

    return child;
  });

  return currentDSL;
};
