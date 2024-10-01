import type { DSLWidget } from "../types";

export const migrateCheckboxGroupWidgetInlineProperty = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "CHECKBOX_GROUP_WIDGET") {
      if (child.version === 1) {
        child.isInline = true;
        child.version = 2;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCheckboxGroupWidgetInlineProperty(child);
    }

    return child;
  });

  return currentDSL;
};
