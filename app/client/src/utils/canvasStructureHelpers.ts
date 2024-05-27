import { pick } from "lodash";

import type {
  CanvasStructure,
  DSL,
} from "reducers/uiReducers/pageCanvasStructureReducer";
import type {
  CanvasWidgetStructure,
  FlattenedWidgetProps,
} from "WidgetProvider/constants";
import { WIDGET_DSL_STRUCTURE_PROPS } from "constants/WidgetConstants";

interface DenormalizeOptions {
  widgetTypeForHaltingRecursion?: string;
}

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
  let archived = dsl.archived;
  let structureChildren: CanvasStructure[] | undefined = undefined;
  let structureArchived: CanvasStructure[] | undefined = undefined;
  // Todo(abhinav): abstraction leak
  if (dsl.type === "TABS_WIDGET") {
    if (children && children.length > 0) {
      structureChildren = children.map((childTab) => ({
        widgetName: childTab.tabName,
        widgetId: childTab.widgetId,
        type: "TABS_WIDGET",
        children: childTab.children,
        archived: childTab.archived,
      }));
    }
  } else if (children && children.length === 1) {
    if (children[0].type === "CANVAS_WIDGET") {
      if (children[0].archived) {
        archived = [...(archived || []), ...children[0].archived];
      }
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
    archived:
      structureArchived ||
      archived?.filter(Boolean).map(getCanvasStructureFromDSL),
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
  options?: DenormalizeOptions,
): CanvasWidgetStructure {
  const { widgetTypeForHaltingRecursion } = options || {};
  const rootWidget = widgets[rootWidgetId];
  let children;
  let archived;

  /**
   * For certain widget, we do not want to denormalize further,
   * like for the List v2, where a another inner list widget is encountered
   * we would want to halt the recursion.
   *  */
  if (widgetTypeForHaltingRecursion !== rootWidget?.type) {
    children = (rootWidget?.children || []).map((childId) =>
      denormalize(childId, widgets, options),
    );
    archived = (rootWidget?.archived || []).map((archivedId) =>
      denormalize(archivedId, widgets, options),
    );
  }

  const staticProps = Object.keys(WIDGET_DSL_STRUCTURE_PROPS);

  const structure = pick(rootWidget, staticProps) as CanvasWidgetStructure;

  structure.children = children;
  structure.archived = archived;

  return structure;
}
