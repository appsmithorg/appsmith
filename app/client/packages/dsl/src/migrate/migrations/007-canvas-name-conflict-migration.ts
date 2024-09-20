import type { DSLWidget } from "../types";

export const canvasNameConflictMigration = (
  currentDSL: DSLWidget,
  props = { counter: 1 },
): DSLWidget => {
  if (
    currentDSL.type === "CANVAS_WIDGET" &&
    currentDSL.widgetName.startsWith("Canvas")
  ) {
    currentDSL.widgetName = `Canvas${props.counter}`;

    // Canvases inside tabs have `name` property as well
    if (currentDSL.name) {
      currentDSL.name = currentDSL.widgetName;
    }

    props.counter++;
  }

  currentDSL.children?.forEach((c: DSLWidget) =>
    canvasNameConflictMigration(c, props),
  );

  return currentDSL;
};
