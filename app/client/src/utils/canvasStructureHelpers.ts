import { WidgetTypes } from "constants/WidgetConstants";
import {
  CanvasStructure,
  DSL,
} from "reducers/uiReducers/pageCanvasStructureReducer";

export const compareAndGenerateImmutableCanvasStructure = (
  original: CanvasStructure,
  current: DSL,
) => {
  const newStructure = getCanvasStructureFromDSL(current);
  if (JSON.stringify(newStructure) === JSON.stringify(original)) {
    return original;
  }
  return newStructure;
};

const getCanvasStructureFromDSL = (dsl: DSL): CanvasStructure => {
  let children = dsl.children;
  let structureChildren: CanvasStructure[] | undefined = undefined;
  if (dsl.type === WidgetTypes.TABS_WIDGET) {
    if (children && children.length > 0) {
      structureChildren = children.map((childTab) => ({
        widgetName: childTab.tabName,
        widgetId: childTab.widgetId,
        type: WidgetTypes.TABS_WIDGET,
        children: childTab.children,
      }));
    }
  } else if (children && children.length === 1) {
    if (children[0].type === WidgetTypes.CANVAS_WIDGET) {
      children = children[0].children;
    }
  }

  return {
    widgetId: dsl.widgetId,
    widgetName: dsl.widgetName,
    type: dsl.type,
    children:
      structureChildren ||
      children?.filter(Boolean).map(getCanvasStructureFromDSL),
  };
};
