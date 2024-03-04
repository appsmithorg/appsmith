import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { widgetHierarchy } from "../utils/constants";

export function getWidgetHierarchy(type: string, id: string): number {
  if (widgetHierarchy[type]) return widgetHierarchy[type];
  if (id === MAIN_CONTAINER_WIDGET_ID) return widgetHierarchy.MAIN_CANVAS;
  return widgetHierarchy.OTHER;
}
