export function getSlidingArenaName(widgetId: string) {
  return `div-selection-${widgetId}`;
}

export function getStickyCanvasName(widgetId: string) {
  return `canvas-selection-${widgetId}`;
}

export function getBaseWidgetClassName(id?: string) {
  return `appsmith_widget_${id}`;
}

export const CANVAS_VIEWPORT = "canvas-viewport";

export const CANVAS_ART_BOARD = "art-board";

export const POSITIONED_WIDGET = "positioned-widget";

export const WIDGET_COMPONENT_BOUNDARY_CLASS = "widget-component-boundary";
