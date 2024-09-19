import has from "lodash/has";
import type { DSLWidget } from "../types";

export const migrateButtonWidgetValidation = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "INPUT_WIDGET") {
    if (!has(currentDSL, "validation")) {
      currentDSL.validation = true;
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children.map((eachWidgetDSL: DSLWidget) => {
      migrateButtonWidgetValidation(eachWidgetDSL);
    });
  }

  return currentDSL;
};
