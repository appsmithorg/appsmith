import { WidgetBaseProps } from "widgets/BaseWidget";

export const extractTillNestedListWidget = (
  flattenedWidgets: WidgetBaseProps["flattenedChildCanvasWidgets"],
  rootWidgetId: string,
  extractedWidgets: WidgetBaseProps["flattenedChildCanvasWidgets"] = {},
) => {
  if (flattenedWidgets) {
    const rootWidget = flattenedWidgets[rootWidgetId];

    if (!rootWidget) return extractedWidgets;

    if (rootWidget.type !== "LIST_WIDGET_V2") {
      rootWidget.children?.forEach((childWidgetId) => {
        extractTillNestedListWidget(
          flattenedWidgets,
          childWidgetId,
          extractedWidgets,
        );
      });
    }

    extractedWidgets[rootWidgetId] = rootWidget;
  }

  return extractedWidgets;
};
