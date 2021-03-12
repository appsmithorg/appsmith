import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import { cloneDeep } from "lodash";
import { WidgetTypes } from "constants/WidgetConstants";

export const migrateTextStyleFromTextWidget = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
): ContainerWidgetProps<WidgetProps> => {
  currentDSL.children = currentDSL.children?.map((_child: WidgetProps) => {
    let child = cloneDeep(_child);
    // If the current child is a TABLE_WIDGET
    if (child.type === WidgetTypes.TEXT_WIDGET) {
      const textStyle = child.textStyle;
      switch (textStyle) {
        case "HEADING":
          child.fontSize = "HEADING1";
          child.fontStyle = "BOLD";
          break;
        case "BODY":
          child.fontSize = "PARAGRAPH";
          child.fontStyle = "";
          break;
        case "LABEL":
          child.fontSize = "PARAGRAPH";
          child.fontStyle = "BOLD";
          break;
        default:
          break;
      }
      delete child.textStyle;
    } else if (child.children && child.children.length > 0) {
      child = migrateTextStyleFromTextWidget(child);
    }
    return child;
  });
  return currentDSL;
};
