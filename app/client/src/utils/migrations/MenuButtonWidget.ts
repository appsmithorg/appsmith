import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateMenuButtonWidgetButtonProperties = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
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
