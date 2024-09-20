import type { DSLWidget } from "../types";

export const migrateRadioGroupAlignmentProperty = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "RADIO_GROUP_WIDGET") {
      if (!child.hasOwnProperty("alignment")) {
        child.alignment = "left";
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateRadioGroupAlignmentProperty(child);
    }

    return child;
  });

  return currentDSL;
};
