import type { DSLWidget } from "../types";
import has from "lodash/has";

export const migrateInputValidation = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "INPUT_WIDGET") {
    if (has(currentDSL, "validation")) {
      // convert boolean to string expression
      if (typeof currentDSL.validation === "boolean") {
        currentDSL.validation = String(currentDSL.validation);
      } else if (typeof currentDSL.validation !== "string") {
        // for any other type of value set to default undefined
        currentDSL.validation = undefined;
      }
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child: DSLWidget) =>
      migrateInputValidation(child),
    );
  }

  return currentDSL;
};
