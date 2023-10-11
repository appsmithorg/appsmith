import type { DSLWidget } from "WidgetProvider/constants";

/**
 * This function transforms a page's DSL to become compatible with the Anvil Layout system
 * Note: This also gets rid of any properties that are not needed for the Auto Layout system
 * @returns dsl: The transformed DSL
 */
export function anvilDSLTransformer() {
  return function (dsl: DSLWidget) {
    const _dsl = dsl; // new reference, we don't want to modify the args directly
    // If there isn't a layout object, we need to create one for Anvil
    // Assumptions:
    // If there is no layout object, then we haven't run this function on this DSL yet
    // If there is a layout object, we have never moved to another layout system for this DSL
    if (!dsl.hasOwnProperty("layout")) {
      _dsl.layout = [
        {
          layoutId: "",
          layoutType: "ALIGNED_COLUMN",
          layout: [],
          isDropTarget: true,
          isPermanent: true,
          childTemplate: {
            layoutId: "",
            layoutType: "ALIGNED_ROW",
            layout: [],
            insertChild: true,
          },
        },
      ];
      delete _dsl.rightColumn;
      delete _dsl.snapColumns;
      delete _dsl.topRow;
      delete _dsl.bottomRow;
      delete _dsl.minHeight;
      delete _dsl.parentColumnSpace;
      delete _dsl.parentRowSpace;
    }
    return _dsl;
  };
}
