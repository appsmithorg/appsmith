import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import { Colors } from "constants/Colors";
import { GridDefaults } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateResizableModalWidgetProperties = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "MODAL_WIDGET" && child.version === 1) {
      const size = child.size;
      switch (size) {
        case "MODAL_SMALL":
          child.width = 456;
          child.height = GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 24;
          break;
        case "MODAL_LARGE":
          child.width = 532;
          child.height = GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 60;
          break;
        default:
          child.width = 456;
          child.height = GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 24;
          break;
      }
      child.version = 2;
      delete child.size;
    } else if (child.children && child.children.length > 0) {
      child = migrateResizableModalWidgetProperties(child);
    }
    return child;
  });
  return currentDSL;
};

export const migrateModalIconButtonWidget = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "ICON_WIDGET") {
      child.type = "ICON_BUTTON_WIDGET";
      child.buttonColor = Colors.OXFORD_BLUE;
      child.buttonVariant = ButtonVariantTypes.TERTIARY;
      child.borderRadius = ButtonBorderRadiusTypes.SHARP;
      child.color = undefined;
    } else if (child.children && child.children.length > 0) {
      child = migrateModalIconButtonWidget(child);
    }
    return child;
  });
  return currentDSL;
};
