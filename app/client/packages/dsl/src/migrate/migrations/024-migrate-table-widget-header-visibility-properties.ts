import type { DSLWidget } from "../types";

export const migrateTableWidgetHeaderVisibilityProperties = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET") {
      if (!("isVisibleSearch" in child)) {
        child.isVisibleSearch = true;
        child.isVisibleFilters = true;
        child.isVisibleDownload = true;
        child.isVisiblePagination = true;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetHeaderVisibilityProperties(child);
    }

    return child;
  });

  return currentDSL;
};
