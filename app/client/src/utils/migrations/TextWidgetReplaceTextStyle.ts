import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetTypes } from "constants/WidgetConstants";
import { FontStyleTypes, TextSizes } from "constants/WidgetConstants";

export const migrateTextStyleFromTextWidget = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
): ContainerWidgetProps<WidgetProps> => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === WidgetTypes.TEXT_WIDGET) {
      const textStyle = child.textStyle;
      switch (textStyle) {
        case "HEADING":
          child.fontSize = TextSizes.HEADING1;
          child.fontStyle = FontStyleTypes.BOLD;
          break;
        case "BODY":
          child.fontSize = TextSizes.PARAGRAPH;
          child.fontStyle = "";
          break;
        case "LABEL":
          child.fontSize = TextSizes.PARAGRAPH;
          child.fontStyle = FontStyleTypes.BOLD;
          break;
        default:
          break;
      }
      child.textColor = "#231F20";
      delete child.textStyle;
    } else if (child.children && child.children.length > 0) {
      child = migrateTextStyleFromTextWidget(child);
    }
    return child;
  });
  return currentDSL;
};
