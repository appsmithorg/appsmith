import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";

export function collisionCheckPostReflow(
  widgets: {
    [widgetId: string]: FlattenedWidgetProps;
  },
  reflowWidgetKeys: string[],
  parentId?: string,
) {
  const widgetKeys = Object.keys(widgets).filter((widgetId) => {
    if (!widgets[widgetId].parentId) return false;

    if (widgets[widgetId].parentId !== parentId) return false;

    if (widgets[widgetId].type === "MODAL_WIDGET") return false;

    return true;
  });

  for (const reflowedKey of reflowWidgetKeys) {
    for (const widgetId of widgetKeys) {
      if (areIntersecting(widgets[reflowedKey], widgets[widgetId])) {
        return false;
      }
    }
  }

  return true;
}

function areIntersecting(r1: FlattenedWidgetProps, r2: FlattenedWidgetProps) {
  if (r1.widgetId === r2.widgetId) return false;

  return !(
    r2.leftColumn >= r1.rightColumn ||
    r2.rightColumn <= r1.leftColumn ||
    r2.topRow >= r1.bottomRow ||
    r2.bottomRow <= r1.topRow
  );
}
