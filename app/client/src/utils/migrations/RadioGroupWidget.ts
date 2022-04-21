import { Alignment } from "@blueprintjs/core";
import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateRadioGroupAlignmentProperty = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "RADIO_GROUP_WIDGET") {
      if (!child.hasOwnProperty("alignment")) {
        child.alignment = Alignment.LEFT;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateRadioGroupAlignmentProperty(child);
    }
    return child;
  });
  return currentDSL;
};
