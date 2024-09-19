import type { DSLWidget } from "../types";

export function migrateListWidgetChildrenForAutoHeight(
  currentDSL: DSLWidget,
  isChildOfListWidget = false,
): DSLWidget {
  if (!currentDSL) return currentDSL;

  let isCurrentListWidget = false;

  if (currentDSL.type === "LIST_WIDGET") isCurrentListWidget = true;

  //Iterate and recursively call each children
  const children = currentDSL.children?.map((childDSL: DSLWidget) =>
    migrateListWidgetChildrenForAutoHeight(
      childDSL,
      isCurrentListWidget || isChildOfListWidget,
    ),
  );

  let newDSL;

  // Add dynamicHeight to FIXED for each of it's children
  if (isChildOfListWidget && !currentDSL.detachFromLayout) {
    newDSL = {
      ...currentDSL,
      dynamicHeight: "FIXED",
    };
  } else {
    newDSL = {
      ...currentDSL,
    };
  }

  if (children) {
    newDSL.children = children;
  }

  return newDSL;
}
