import { pick } from "lodash";

import {
  CanvasStructure,
  DSL,
} from "reducers/uiReducers/pageCanvasStructureReducer";
import { CanvasWidgetStructure, FlattenedWidgetProps } from "widgets/constants";
import { WIDGET_DSL_STRUCTURE_PROPS } from "constants/WidgetConstants";

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
  // Todo(abhinav): abstraction leak
  if (dsl.type === "TABS_WIDGET") {
    if (children && children.length > 0) {
      structureChildren = children.map((childTab) => ({
        widgetName: childTab.tabName,
        widgetId: childTab.widgetId,
        type: "TABS_WIDGET",
        children: childTab.children,
      }));
    }
  } else if (children && children.length === 1) {
    if (children[0].type === "CANVAS_WIDGET") {
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

/**
 * Generate dsl type skeletal structure from widgets
 * @param rootWidgetId
 * @param widgets
 * @returns
 */
export function denormalize(
  rootWidgetId: string,
  widgets: Record<string, FlattenedWidgetProps>,
): CanvasWidgetStructure {
  const rootWidget = widgets[rootWidgetId];

  const children = (rootWidget?.children || []).map((childId) =>
    denormalize(childId, widgets),
  );

  const staticProps = Object.keys(WIDGET_DSL_STRUCTURE_PROPS);

  const structure = pick(rootWidget, staticProps) as CanvasWidgetStructure;

  structure.children = children;

  return structure;
}
