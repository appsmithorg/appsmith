import type { WidgetProps } from "widgets/BaseWidget";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";

export const migrateContainerAndFormWidgetStyleProperties = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CONTAINER_WIDGET" || child.type === "FORM_WIDGET") {
      if (!("borderWidth" in child)) {
        child.borderWidth = "0";
        child.borderRadius = "0";
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateContainerAndFormWidgetStyleProperties(child);
    }
    return child;
  });
  return currentDSL;
};
