import type { DSLWidget } from "../types";

export enum OverflowTypes {
  SCROLL = "SCROLL",
  TRUNCATE = "TRUNCATE",
  NONE = "NONE",
}

export const migrateScrollTruncateProperties = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
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
