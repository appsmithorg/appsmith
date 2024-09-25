import type { DSLWidget } from "../types";

export const revertTableDefaultSelectedRow = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "TABLE_WIDGET") {
    if (currentDSL.version === 1 && currentDSL.defaultSelectedRow === "0")
      currentDSL.defaultSelectedRow = undefined;

    // update version to 3 for all table dsl
    currentDSL.version = 3;
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child: DSLWidget) =>
      revertTableDefaultSelectedRow(child),
    );
  }

  return currentDSL;
};
