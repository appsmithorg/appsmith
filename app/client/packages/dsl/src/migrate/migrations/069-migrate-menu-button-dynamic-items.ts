import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateMenuButtonDynamicItems = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "MENU_BUTTON_WIDGET" && !widget.menuItemsSource) {
      widget.menuItemsSource = "STATIC";
    }
  });
};
