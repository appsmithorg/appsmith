import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateCheckboxGroupWidgetInlineProperty = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CHECKBOX_GROUP_WIDGET") {
      if (child.version === 1) {
        child.isInline = true;
        child.version = 2;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCheckboxGroupWidgetInlineProperty(child);
    }
    return child;
  });
  return currentDSL;
};

export const migrateCheckboxGroupDefaultSelectedValuesProperty = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CHECKBOX_GROUP_WIDGET") {
      if (child.version === 2) {
        const defaultSelectedValues = child.defaultSelectedValues;
        if (!Array.isArray(defaultSelectedValues) && defaultSelectedValues) {
          child.defaultSelectedValues = defaultSelectedValues
            .split(",")
            .map((val: string) => val.trim());
        }
        child.version = 3;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCheckboxGroupWidgetInlineProperty(child);
    }
    return child;
  });
  return currentDSL;
};
