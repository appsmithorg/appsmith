import { WidgetTypes } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";

export const migrateCheckboxGroupWidgetInlineProperty = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === WidgetTypes.CHECKBOX_GROUP_WIDGET) {
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
