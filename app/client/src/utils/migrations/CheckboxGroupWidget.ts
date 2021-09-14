import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateCheckboxGroupWidgetInlineProperty = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CHECKBOX_GROUP_WIDGET") {
      if (!("isInline" in child)) {
        child.isInline = true;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCheckboxGroupWidgetInlineProperty(child);
    }
    return child;
  });
  return currentDSL;
};
