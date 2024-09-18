/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DSLWidget } from "../types";
import { removeSpecialChars } from "../utils";

export const migrateTablePrimaryColumnsBindings = (currentDSL: DSLWidget) => {
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
          const newComputedValue = value.computedValue
            ? value.computedValue.replace(
                `${child.widgetName}.tableData.map`,
                `${child.widgetName}.sanitizedTableData.map`,
              )
            : "";

          newPrimaryColumns[sanitizedKey] = {
            ...value,
            computedValue: newComputedValue,
          };
        }

        child.primaryColumns = newPrimaryColumns;
        child.dynamicBindingPathList = child.dynamicBindingPathList?.map(
          (path: { key: string }) => {
            path.key = path.key.split(" ").join("_");

            return path;
          },
        );
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTablePrimaryColumnsBindings(child);
    }

    return child;
  });

  return currentDSL;
};
