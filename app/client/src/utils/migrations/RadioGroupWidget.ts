import { Alignment } from "@blueprintjs/core";
import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateInlineAndAlignmentProperties = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "RADIO_GROUP_WIDGET") {
      if (!("isInline" in child)) {
        child.isInline = false;
      }
      if (!("alignment" in child)) {
        child.alignment = Alignment.LEFT;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateInlineAndAlignmentProperties(child);
    }
    return child;
  });
  return currentDSL;
};
