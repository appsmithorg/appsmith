import type { DSLWidget } from "../types";

export const migratePhoneInputWidgetAllowFormatting = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "PHONE_INPUT_WIDGET") {
      child.allowFormatting = true;
    } else if (child.children && child.children.length > 0) {
      child = migratePhoneInputWidgetAllowFormatting(child);
    }

    return child;
  });

  return currentDSL;
};
