import type { DSLWidget } from "../types";

export const migrateMenuButtonWidgetButtonProperties = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "MENU_BUTTON_WIDGET") {
      if (!("menuStyle" in child)) {
        child.menuStyle = "PRIMARY";
        child.menuVariant = "SOLID";
        child.isVisible = true;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateMenuButtonWidgetButtonProperties(child);
    }

    return child;
  });

  return currentDSL;
};
