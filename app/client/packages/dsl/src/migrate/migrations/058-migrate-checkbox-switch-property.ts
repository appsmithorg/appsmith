import type { DSLWidget } from "../types";

export enum AlignWidgetTypes {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export enum LabelPosition {
  Left = "Left",
  Right = "Right",
}

export const migrateCheckboxSwitchProperty = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
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
