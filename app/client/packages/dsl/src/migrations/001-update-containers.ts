import generate from "nanoid/generate";
import type { DSLWidget } from "./types";

const ALPHANUMERIC = "1234567890abcdefghijklmnopqrstuvwxyz";
export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

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
      const canvas = {
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
