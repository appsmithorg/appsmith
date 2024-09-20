/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DSLWidget } from "../types";
import { removeSpecialChars } from "../utils";

export const migrateTablePrimaryColumnsComputedValue = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET") {
      if (
        child.primaryColumns &&
        Object.keys(child.primaryColumns).length > 0
      ) {
        const newPrimaryColumns: Record<string, any> = {};

        for (const [key, value] of Object.entries(
          child.primaryColumns as Record<string, any>,
        )) {
          const sanitizedKey = removeSpecialChars(key, 200);
          let newComputedValue = "";

          if (value.computedValue) {
            newComputedValue = value.computedValue.replace(
              `${child.widgetName}.sanitizedTableData.map((currentRow) => { return`,
              `${child.widgetName}.sanitizedTableData.map((currentRow) => (`,
            );
            // change matching "}" bracket with ")"
            const lastParanthesesInd = newComputedValue.length - 4;

            newComputedValue =
              newComputedValue.substring(0, lastParanthesesInd) +
              ")" +
              newComputedValue.substring(lastParanthesesInd + 1);
          }

          newPrimaryColumns[sanitizedKey] = {
            ...value,
            computedValue: newComputedValue,
          };
        }

        child.primaryColumns = newPrimaryColumns;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTablePrimaryColumnsComputedValue(child);
    }

    return child;
  });

  return currentDSL;
};
