/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DSLWidget } from "../types";
import get from "lodash/get";
import isString from "lodash/isString";
import set from "lodash/set";

const renameKeyInObject = (object: any, key: string, newKey: string) => {
  if (object[key]) {
    set(object, newKey, object[key]);
  }

  return object;
};

/**
 * changes items -> listData
 *
 * @param currentDSL
 * @returns
 */
export const migrateItemsToListDataInListWidget = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "LIST_WIDGET") {
    currentDSL = renameKeyInObject(currentDSL, "items", "listData");

    currentDSL.dynamicBindingPathList = currentDSL.dynamicBindingPathList?.map(
      (path: { key: string }) => {
        if (path.key === "items") {
          return { key: "listData" };
        }

        return path;
      },
    );

    currentDSL.dynamicBindingPathList?.map((path: { key: string }) => {
      if (
        get(currentDSL, path.key) &&
        path.key !== "items" &&
        path.key !== "listData" &&
        isString(get(currentDSL, path.key))
      ) {
        set(
          currentDSL,
          path.key,
          get(currentDSL, path.key, "").replace("items", "listData"),
        );
      }
    });

    Object.keys(currentDSL.template).map((widgetName) => {
      const currentWidget = currentDSL.template[widgetName];

      currentWidget.dynamicBindingPathList?.map((path: { key: string }) => {
        set(
          currentWidget,
          path.key,
          get(currentWidget, path.key).replace("items", "listData"),
        );
      });
    });
  }

  if (currentDSL.children && currentDSL.children.length > 0) {
    currentDSL.children = currentDSL.children.map(
      migrateItemsToListDataInListWidget,
    );
  }

  return currentDSL;
};
