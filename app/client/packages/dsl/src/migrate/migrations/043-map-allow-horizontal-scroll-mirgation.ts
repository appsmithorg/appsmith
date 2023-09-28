import type { DSLWidget } from "../types";

export const mapAllowHorizontalScrollMigration = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "CHART_WIDGET") {
      child.allowScroll = child.allowHorizontalScroll;
      delete child.allowHorizontalScroll;
    }

    if (Array.isArray(child.children) && child.children.length > 0)
      child = mapAllowHorizontalScrollMigration(child);

    return child;
  });

  return currentDSL;
};
