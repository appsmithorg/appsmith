import { groupBy, xor } from "lodash";
import { CanvasStructure, DSL } from "reducers/uiReducers/pageCanvasStructure";

export const compareAndGenerateImmutableCanvasStructure = (
  original: CanvasStructure,
  current: DSL,
) => {
  const newStructure = getCanvasStructureFromDSL(current);
  if (JSON.stringify(newStructure) === JSON.stringify(original)) {
    return original;
  }
  return newStructure;

  // const oldRef: CanvasStructure = original;
  // const newRef: DSL = current;
  // if (!oldRef) return getCanvasStructureFromDSL(newRef);
  // if (oldRef.widgetId === newRef.widgetId) {
  //   if (oldRef.widgetName !== newRef.widgetName) {
  //     oldRef.widgetName = newRef.widgetName;
  //   }
  // }
  // if (Array.isArray(oldRef.children) && Array.isArray(newRef.children)) {
  //   const groupedDSLChildren = groupBy(newRef.children, "widgetId");
  //   const newWidgetIds = Object.keys(groupedDSLChildren);

  //   const groupedCanvasStructureChildren = groupBy(oldRef.children, "widgetId");
  //   const oldWidgetIds = Object.keys(groupedCanvasStructureChildren);

  //   const differentWidgets = xor(newWidgetIds, oldWidgetIds);

  //   for (let i = 0; i < oldRef.children.length; i++) {
  //     const currentChild = oldRef.children[i];
  //     if (currentChild) {
  //       const ind = newWidgetIds.indexOf(oldRef.children[i].widgetId);
  //       if (ind > -1) {
  //         oldRef.children[i] = compareAndGenerateImmutableCanvasStructure(
  //           oldRef.children[i],
  //           groupedDSLChildren[oldRef.children[i].widgetId][0],
  //         );
  //       } else {
  //         delete differentWidgets[
  //           differentWidgets.indexOf(oldRef.children[i].widgetId)
  //         ];
  //         delete oldRef.children[i];
  //       }
  //     }
  //   }
  //   if (differentWidgets.filter(Boolean).length > 0) {
  //     differentWidgets.filter(Boolean).forEach((widgetId: string) => {
  //       if (groupedDSLChildren[widgetId]) {
  //         const newWidgetDSL = groupedDSLChildren[widgetId][0];
  //         oldRef.children?.push({
  //           widgetId,
  //           widgetName: newWidgetDSL.widgetName,
  //           children:
  //             newWidgetDSL.children && Array.isArray(newWidgetDSL.children)
  //               ? newWidgetDSL.children.map(getCanvasStructureFromDSL)
  //               : [],
  //         });
  //       }
  //     });
  //   }
  // } else if (
  //   !Array.isArray(oldRef.children) &&
  //   Array.isArray(newRef.children)
  // ) {
  //   oldRef.children = newRef.children.map(getCanvasStructureFromDSL);
  // } else if (
  //   Array.isArray(oldRef.children) &&
  //   !Array.isArray(newRef.children)
  // ) {
  //   oldRef.children = [];
  // } else {
  //   delete oldRef.children;
  // }
  // return oldRef;
};

const getCanvasStructureFromDSL = (dsl: DSL): CanvasStructure => {
  return {
    widgetId: dsl.widgetId,
    widgetName: dsl.widgetName,
    type: dsl.type,
    children: dsl.children?.map(getCanvasStructureFromDSL),
  };
};
