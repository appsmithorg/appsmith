import type { WidgetBaseProps } from "widgets/BaseWidget";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { checkForOnClick } from "widgets/WidgetUtils";
import type {
  FlexLayer,
  LayerChild,
} from "layoutSystems/autolayout/utils/types";

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

/**
 * Create new flex layer objects from flexLayers argument by replacing widget Ids from rowReferences
 * @param flexLayers
 * @param rowReferences
 * @returns
 */
export function getMetaFlexLayers(
  flexLayers: FlexLayer[],
  rowReferences: Record<string, string | undefined>,
): FlexLayer[] {
  const metaFlexLayers: FlexLayer[] = [];

  for (const flexLayer of flexLayers) {
    const { children } = flexLayer;

    const metaFlexChildren: LayerChild[] = [];

    for (const flexChild of children) {
      if (rowReferences[flexChild.id]) {
        const metaWidgetId = rowReferences[flexChild.id] || flexChild.id;

        metaFlexChildren.push({
          align: flexChild.align,
          id: metaWidgetId,
        });
      }
    }

    metaFlexLayers.push({ children: metaFlexChildren });
  }

  return metaFlexLayers;
}

export const isTargetElementClickable = (e: React.MouseEvent<HTMLElement>) => {
  const target = e.target as HTMLElement;
  const isInput = target.tagName === "INPUT";
  const hasControl = (target as HTMLLabelElement).control;
  const parentHasControl = (target.parentElement as HTMLLabelElement).control;
  const hasLink = (target as HTMLAnchorElement).href;

  const hasOnClick = checkForOnClick(e);

  return isInput || hasControl || parentHasControl || hasLink || hasOnClick;
};
