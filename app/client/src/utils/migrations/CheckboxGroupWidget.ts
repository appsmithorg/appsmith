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
        let values: string[] = [];
        const value = child.defaultSelectedValues;

        if (typeof value === "string") {
          try {
            values = JSON.parse(value);
            if (!Array.isArray(values)) {
              throw new Error();
            }
          } catch {
            values = value.length ? value.split(",") : [];
            if (values.length > 0) {
              values = values.map((_v: string) => _v.trim());
            }
          }
          child.defaultSelectedValues = values;
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
