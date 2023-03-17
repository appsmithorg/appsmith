import { WidgetBaseProps } from "widgets/BaseWidget";
import { FlattenedWidgetProps } from "widgets/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

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

export const getNumberOfParentListWidget = (
  widgetId: string,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  numOfParentListWidget = 0,
): number => {
  if (
    !widgetId ||
    !widgets[widgetId] ||
    !widgets[widgetId].parentId ||
    widgetId === MAIN_CONTAINER_WIDGET_ID
  ) {
    return numOfParentListWidget;
  }

  if (widgets[widgetId].type === "LIST_WIDGET_V2") numOfParentListWidget += 1;

  return getNumberOfParentListWidget(
    widgets[widgetId].parentId as string,
    widgets,
    numOfParentListWidget,
  );
};

export const getNumberOfChildListWidget = (
  widgetId: string,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
): number => {
  let numOfChildListWidget = 0;
  if (
    !widgetId ||
    !widgets[widgetId] ||
    !widgets[widgetId].children?.length ||
    widgetId === MAIN_CONTAINER_WIDGET_ID
  ) {
    return numOfChildListWidget;
  }

  if (widgets[widgetId].type === "LIST_WIDGET_V2") numOfChildListWidget += 1;

  widgets[widgetId].children?.forEach(
    (childWidgetId) =>
      (numOfChildListWidget += getNumberOfChildListWidget(
        childWidgetId,
        widgets,
      )),
  );

  return numOfChildListWidget;
};
