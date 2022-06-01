import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";
import { LabelPosition } from "components/constants";
import { AlignWidgetTypes } from "widgets/constants";

export const migrateCheckboxSwitchProperty = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "SWITCH_WIDGET" || child.type === "CHECKBOX_WIDGET") {
      if (child.alignWidget === "RIGHT") {
        child.alignWidget = AlignWidgetTypes.RIGHT;
        child.labelPosition = LabelPosition.Left;
      } else {
        child.alignWidget = AlignWidgetTypes.LEFT;
        child.labelPosition = LabelPosition.Right;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCheckboxSwitchProperty(child);
    }
    return child;
  });
  return currentDSL;
};
