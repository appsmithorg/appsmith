export function getStickyCanvasName(widgetId: string) {
  return `div-selection-${widgetId}`;
}

export function getSlidingCanvasName(widgetId: string) {
  return `canvas-selection-${widgetId}`;
}

export function getBaseWidgetClassName(id?: string) {
  return `appsmith_widget_${id}`;
}

export const POSITIONED_WIDGET = "positioned-widget";
