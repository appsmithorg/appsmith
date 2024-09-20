import { canvasNameConflictMigration } from "./007-canvas-name-conflict-migration";
import type { DSLWidget } from "../types";

export const renamedCanvasNameConflictMigration = (
  currentDSL: DSLWidget,
  props = { counter: 1 },
): DSLWidget => {
  // Rename all canvas widgets except for MainContainer
  if (
    currentDSL.type === "CANVAS_WIDGET" &&
    currentDSL.widgetName !== "MainContainer"
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
