import type { ColumnProperties, DSLWidget } from "../types";
import { objectKeys } from "@appsmith/utils";
import isEmpty from "lodash/isEmpty";

const addIsDisabledToButtonColumn = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "TABLE_WIDGET") {
    if (!isEmpty(currentDSL.primaryColumns)) {
      for (const key of objectKeys(currentDSL.primaryColumns as Record<string, ColumnProperties>)) {
        if (currentDSL.primaryColumns[key].columnType === "button") {
          if (!currentDSL.primaryColumns[key].hasOwnProperty("isDisabled")) {
            currentDSL.primaryColumns[key]["isDisabled"] = false;
          }
        }

        if (!currentDSL.primaryColumns[key].hasOwnProperty("isCellVisible")) {
          currentDSL.primaryColumns[key]["isCellVisible"] = true;
        }
      }
    }
  }

  return currentDSL;
};

export const migrateIsDisabledToButtonColumn = (currentDSL: DSLWidget) => {
  const newDSL = addIsDisabledToButtonColumn(currentDSL);

  newDSL.children = newDSL.children?.map((children: DSLWidget) => {
    return migrateIsDisabledToButtonColumn(children);
  });

  return currentDSL;
};
