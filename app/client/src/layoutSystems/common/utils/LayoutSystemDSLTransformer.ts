import { LayoutSystemTypes } from "layoutSystems/types";
import { autoLayoutDSLTransformer } from "layoutSystems/autolayout/utils/AutoLayoutDSLTransformer";
import { anvilDSLTransformer } from "layoutSystems/anvil/utils/AnvilDSLTransformer";
import type { DSLWidget } from "WidgetProvider/constants";

/**
 * This function is the API provided by the layout systems module to the rest of the app for transforming DSLs
 * @param layoutSystemType The type of the Layout system (Fixed, Auto, Anvil)
 * @param mainCanvasWidth The width of the main canvas in pixels (necessary for Auto Layout transformations, particularly for conversion between Fixed and Auto Layout)
 * @returns dslTransformer A function that takes in a DSL and returns a transformed DSL
 */
export function getLayoutSystemDSLTransformer(
  layoutSystemType: LayoutSystemTypes,
  mainCanvasWidth: number,
) {
  switch (layoutSystemType) {
    case LayoutSystemTypes.FIXED:
      return (dsl: DSLWidget) => dsl;
    case LayoutSystemTypes.AUTO:
      return autoLayoutDSLTransformer(mainCanvasWidth);
    case LayoutSystemTypes.ANVIL:
      return anvilDSLTransformer;
  }
}
