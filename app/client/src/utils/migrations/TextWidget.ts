import { WidgetProps } from "widgets/BaseWidget";
import { FontStyleTypes, TextSizes } from "constants/WidgetConstants";
import { DSLWidget } from "widgets/constants";
import { OverflowTypes } from "widgets/TextWidget/constants";

export const migrateTextStyleFromTextWidget = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TEXT_WIDGET") {
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

export const migrateScrollTruncateProperties = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TEXT_WIDGET") {
      if (child.shouldTruncate) {
        child.overflow = OverflowTypes.TRUNCATE;
      } else if (child.shouldScroll) {
        child.overflow = OverflowTypes.SCROLL;
      } else {
        child.overflow = OverflowTypes.NONE;
      }
      delete child.shouldScroll;
      delete child.shouldTruncate;
    } else if (child.children && child.children.length > 0) {
      child = migrateScrollTruncateProperties(child);
    }
    return child;
  });
  return currentDSL;
};
