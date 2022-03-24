import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migratePhoneInputWidgetAllowFormatting = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "PHONE_INPUT_WIDGET") {
      child.allowFormatting = true;
    } else if (child.children && child.children.length > 0) {
      child = migratePhoneInputWidgetAllowFormatting(child);
    }
    return child;
  });
  return currentDSL;
};
