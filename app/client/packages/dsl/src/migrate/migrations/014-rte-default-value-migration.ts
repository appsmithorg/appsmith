import type { DSLWidget } from "../types";

export const rteDefaultValueMigration = (currentDSL: DSLWidget): DSLWidget => {
  if (currentDSL.type === "RICH_TEXT_EDITOR_WIDGET") {
    currentDSL.inputType = "html";
  }

  currentDSL.children?.forEach((children: DSLWidget) =>
    rteDefaultValueMigration(children),
  );

  return currentDSL;
};
