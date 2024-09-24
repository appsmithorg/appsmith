import type { DSLWidget } from "../types";

export const isSortableMigration = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET" && !child.hasOwnProperty("isSortable")) {
      child["isSortable"] = true;
    } else if (child.children && child.children.length > 0) {
      child = isSortableMigration(child);
    }

    return child;
  });

  return currentDSL;
};
