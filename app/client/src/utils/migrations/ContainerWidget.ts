import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import WidgetFactory from "utils/WidgetFactory";

const WidgetTypes = WidgetFactory.widgetTypes;

export const migrateContainerAndFormWidgetStyleProperties = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (
      child.type === WidgetTypes.CONTAINER_WIDGET ||
      child.type === WidgetTypes.FORM_WIDGET
    ) {
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
