import type { DSLWidget } from "../types";

export const migrateModalIconButtonWidget = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "ICON_WIDGET") {
      child.type = "ICON_BUTTON_WIDGET";
      child.buttonColor = "#2E3D49"; // Colors.OXFORD_BLUE;
      child.buttonVariant = "TERTIARY";
      child.borderRadius = "SHARP";
      child.color = undefined;
    } else if (child.children && child.children.length > 0) {
      child = migrateModalIconButtonWidget(child);
    }

    return child;
  });

  return currentDSL;
};
