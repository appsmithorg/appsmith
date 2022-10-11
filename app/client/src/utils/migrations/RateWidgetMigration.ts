import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

// migrate all rate widgets with isDisabled = true to isReadOnly = true
export function migrateRateWidgetDisabledState(currentDSL: DSLWidget) {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "RATE_WIDGET" && child.isDisabled === true) {
      child.isDisabled = false;
      child.isReadOnly = true;
    } else if (child.children && child.children.length > 0) {
      child = migrateRateWidgetDisabledState(child);
    }
    return child;
  });

  return currentDSL;
}
