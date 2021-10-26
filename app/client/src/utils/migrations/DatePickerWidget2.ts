import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateDatePickerForIsTimeEnabled = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "DATE_PICKER_WIDGET2") {
      if (!("isTimeEnabled" in child)) {
        child.isTimeEnabled = true;
        child.dateTimeFormat = child.dateFormat;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateDatePickerForIsTimeEnabled(child);
    }
    return child;
  });
  return currentDSL;
};
