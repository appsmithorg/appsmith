import type { DSLWidget } from "../types";

export const migrateTextStyleFromTextWidget = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TEXT_WIDGET") {
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
      child.textColor = "#231F20";
      delete child.textStyle;
    } else if (child.children && child.children.length > 0) {
      child = migrateTextStyleFromTextWidget(child);
    }

    return child;
  });

  return currentDSL;
};
