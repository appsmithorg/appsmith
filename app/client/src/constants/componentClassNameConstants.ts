export function getSlidingArenaName(widgetId: string) {
  return `div-selection-${widgetId}`;
}

export function getStickyCanvasName(widgetId: string) {
  return `canvas-selection-${widgetId}`;
}

export function getDraggingCanvasName(widgetId: string) {
  return `canvas-dragging-${widgetId}`;
}

export function getDragArenaName(widgetId: string) {
  return `div-dragarena-${widgetId}`;
}

export function getBaseWidgetClassName(id?: string) {
  return `appsmith_widget_${id}`;
}

export const POSITIONED_WIDGET = "positioned-widget";
