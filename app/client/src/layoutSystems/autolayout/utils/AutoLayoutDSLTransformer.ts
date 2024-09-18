import type { DSLWidget } from "WidgetProvider/constants";
import convertDSLtoAutoAndUpdatePositions from "layoutSystems/common/DSLConversions/fixedToAutoLayout";
import { checkIsDSLAutoLayout } from "./AutoLayoutUtils";

/**
 * This function transforms a page's DSL to become compatible with the Auto Layout system
 * @param mainCanvasWidth The width of the Canvas in pixels
 * @returns dsl: The transformed DSL
 */
export function autoLayoutDSLTransformer(mainCanvasWidth: number) {
  return function (dsl: DSLWidget) {
    if (checkIsDSLAutoLayout(dsl)) {
      return dsl;
    }

    return convertDSLtoAutoAndUpdatePositions(dsl, mainCanvasWidth);
  };
}
