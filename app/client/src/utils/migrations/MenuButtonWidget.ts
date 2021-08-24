import { WidgetTypes } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";

export const migrateMenuButtonWidgetButtonProperties = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === WidgetTypes.MENU_BUTTON_WIDGET) {
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
