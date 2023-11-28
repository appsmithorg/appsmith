import type { DSLWidget } from "WidgetProvider/constants";
import { generateReactKey } from "utils/generators";
import { LayoutComponentTypes } from "./anvilTypes";

/**
 * This function transforms a page's DSL to become compatible with the Anvil Layout system
 * Note: This also gets rid of any properties that are not needed for the Auto Layout system
 * @returns dsl: The transformed DSL
 */
export function anvilDSLTransformer(dsl: DSLWidget) {
  const _dsl = dsl; // new reference, we don't want to modify the args directly
  // If there isn't a layout object, we need to create one for Anvil
  // Assumptions:
  // If there is no layout object, then we haven't run this function on this DSL yet
  // If there is a layout object, we have never moved to another layout system for this DSL
  if (!dsl.hasOwnProperty("layout")) {
    _dsl.layout = [
      {
        layoutId: generateReactKey(),
        layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
        layout: [],
        layoutStyle: {
          border: "none",
          height: "100%",
          minHeight: "70vh",
          padding: "4px 4px 5rem",
        },
        isDropTarget: true,
        isPermanent: true,
        childTemplate: {
          layoutId: "",
          layoutType: LayoutComponentTypes.ALIGNED_WIDGET_ROW,
          layout: [],
          insertChild: true,
        },
      },
    ];
  }
  return _dsl;
}
