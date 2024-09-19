/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DSLWidget } from "../types";
import { generateReactKey } from "../utils";

export const updateContainers = (dsl: DSLWidget) => {
  if (dsl.type === "CONTAINER_WIDGET" || dsl.type === "FORM_WIDGET") {
    if (
      !(
        dsl.children &&
        dsl.children.length > 0 &&
        (dsl.children[0].type === "CANVAS_WIDGET" ||
          dsl.children[0].type === "FORM_WIDGET")
      )
    ) {
      const canvas: any = {
        ...dsl,
        backgroundColor: "transparent",
        type: "CANVAS_WIDGET",
        detachFromLayout: true,
        topRow: 0,
        leftColumn: 0,
        rightColumn: dsl.parentColumnSpace * (dsl.rightColumn - dsl.leftColumn),
        bottomRow: dsl.parentRowSpace * (dsl.bottomRow - dsl.topRow),
        widgetName: generateReactKey(),
        widgetId: generateReactKey(),
        parentRowSpace: 1,
        parentColumnSpace: 1,
        containerStyle: "none",
        canExtend: false,
        isVisible: true,
      };

      delete canvas.dynamicBindings;
      delete canvas.dynamicProperties;

      if (canvas.children && canvas.children.length > 0)
        canvas.children = canvas.children.map(updateContainers);

      dsl.children = [{ ...canvas }];
    }
  }

  return dsl;
};
