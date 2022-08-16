import { pick } from "lodash";

import { CanvasWidgetStructure } from "widgets/constants";
import { FlattenedWidgetProps } from "./canvasWidgetsReducer";
import { WIDGET_DSL_STRUCTURE_PROPS } from "constants/WidgetConstants";

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

  const children = (rootWidget.children || []).map((childId) =>
    denormalize(childId, widgets),
  );

  const staticProps = Object.keys(WIDGET_DSL_STRUCTURE_PROPS);

  const structure = pick(rootWidget, staticProps) as CanvasWidgetStructure;

  structure.children = children;

  return structure;
}
