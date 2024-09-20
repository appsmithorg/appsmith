import type { DSLWidget } from "../types";
import { isDynamicValue } from "../utils";

// migrate all rate widgets with isDisabled = true to isReadOnly = true
export function migrateRateWidgetDisabledState(currentDSL: DSLWidget) {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "RATE_WIDGET") {
      // if isDisabled is true, set isReadOnly to true
      if (child.isDisabled === true) {
        child.isDisabled = false;
        child.isReadOnly = true;
      } else if (
        // if isDisabled is a dynamic value, set isReadOnly to the same dynamic value
        typeof child.isDisabled === "string" &&
        isDynamicValue(child.isDisabled)
      ) {
        child.isReadOnly = child.isDisabled;
        child.isDisabled = false;

        // add readonly to dynamic binding
        child.dynamicBindingPathList = [
          ...(child.dynamicBindingPathList || []),
          {
            key: "isReadOnly",
          },
        ];

        child.dynamicPropertyPathList = [
          ...(child.dynamicPropertyPathList || []),
          {
            key: "isReadOnly",
          },
        ];

        // remove readonly from dynamic binding
        child.dynamicBindingPathList = child.dynamicBindingPathList.filter(
          (item: { key: string }) => item.key !== "isDisabled",
        );

        child.dynamicPropertyPathList = child.dynamicPropertyPathList.filter(
          (item: { key: string }) => item.key !== "isDisabled",
        );
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateRateWidgetDisabledState(child);
    }

    return child;
  });

  return currentDSL;
}
