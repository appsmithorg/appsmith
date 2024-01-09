import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { CopiedWidgetData } from "./types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { getContainingLayoutMapping, getParentLayout } from "./utils";
import { call } from "redux-saga/effects";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { anvilWidgets } from "widgets/anvil/constants";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import { defaultHighlightRenderInfo } from "../constants";
import { handleWidgetMovement } from "layoutSystems/anvil/integrations/sagas/anvilDraggingSagas";
import { generateReactKey } from "utils/generators";
import { addNewWidgetAndUpdateLayout } from "../widgetUtils";

/**
 * 1.Parse through copiedWidgets.
 * => split them on type: Section > Zone > others.
 * 2. Identify the type of the new parent.
 * 3. Paste only if copied widgets are of lower order type.
 * 4. If copied widgets are multiple orders lower than the new parent,
 * => recursively create a higher order parent for them, and add them to it.
 * 5. repeat this pattern until all copied widgets are only one order lower than the new parent.
 * 6. Then add them to the new parent.
 *
 * e.g. CopiedWidgets: [Zone, Text (other), Button (other)] and newParent = Section.
 * order: Section > Zone > Other.
 *
 * Process:
 * 1. Split copiedWidgets into [Zone (Z1)] and [Text, Button].
 * 2. Create a new Zone (Z2) widget and add [Text, Button] to it.
 * 3. Z1 and Z2 are one order lower than newParent.
 * 4. add them to newParent.
 */

const widgetTypes: { [key: string]: number } = {
  MAIN_CANVAS: 0,
  [anvilWidgets.SECTION_WIDGET]: 1,
  [anvilWidgets.ZONE_WIDGET]: 2,
  OTHER: 3,
};

export function* pasteMigrantWidgets(
  copiedWidgets: CopiedWidgetData[],
  allWidgets: CanvasWidgetsReduxState,
  newParentId: string,
  widgetIdMap: { [key: string]: string },
  reverseWidgetIdMap: { [key: string]: string },
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  let map: { [key: string]: string } = { ...widgetIdMap };
  let reverseMap: { [key: string]: string } = { ...reverseWidgetIdMap };

  const parentWidget: FlattenedWidgetProps = widgets[newParentId];

  const parentOrder: number = getWidgetOrder(
    parentWidget.type,
    parentWidget.widgetId,
  );

  const order: CopiedWidgetData[][] = splitWidgetsByOrder(copiedWidgets);

  let index = parentOrder + 1;
  let parentId: string = parentWidget.widgetId;
  let currentParent: FlattenedWidgetProps = widgets[parentId];
  let parentLayout: LayoutProps | null = getParentLayout(widgets[parentId]);
  if (!parentLayout) {
    throw new Error(`Invalid parent layout: ${newParentId}`);
  }
  let newLayoutId: string = parentLayout.layoutId;
  let isMainCanvas = currentParent.widgetId === MAIN_CONTAINER_WIDGET_ID;
  let isSection = currentParent.type === anvilWidgets.SECTION_WIDGET;
  while (index < order.length) {
    const widgetsToAdd: CopiedWidgetData[] = order[index];
    /**
     * Group copied widgets based on grouping status in original layouts.
     */
    const widgetGrouping: WidgetLayoutProps[][] = getContainingLayoutMapping(
      widgets,
      widgetsToAdd,
    );

    for (const group of widgetGrouping) {
      let layoutId = ""; // id of layout created for this group.
      for (let i = 0; i < group.length; i += 1) {
        if (!parentLayout) break;
        const { alignment, widgetId } = group[i];
        /**
         * If !layoutId, then widgets are added at the end of the parentLayout.
         */
        const rowIndex: number = !layoutId ? parentLayout.layout.length : i;
        const highlight: AnvilHighlightInfo = {
          ...defaultHighlightRenderInfo,
          alignment,
          canvasId: parentId,
          layoutOrder: !layoutId ? [newLayoutId] : [newLayoutId, layoutId],
          rowIndex,
        };
        widgets = yield call(
          handleWidgetMovement,
          widgets,
          [map[widgetId]],
          highlight,
          isMainCanvas,
          isSection,
        );
        /**
         * Update parent layout.
         */
        parentLayout = getParentLayout(widgets[parentId]);
        /**
         * Newly inserted widgets will be at the end of the parent layout.
         */
        layoutId = parentLayout?.layout[
          parentLayout.layout.length
        ].hasOwnProperty("layoutId")
          ? (parentLayout?.layout[rowIndex] as LayoutProps)?.layoutId
          : "";
      }
    }

    // Update index.
    index += 1;

    /**
     * All members of this order have been pasted.
     * Check if there are any widgets in the next lower order,
     * if true => create a new widget of this order and use it as the parent for the next order.
     */
    if (order[index].length) {
      const highlight: AnvilHighlightInfo = {
        ...defaultHighlightRenderInfo,
        alignment: widgetGrouping[0][0].alignment,
        canvasId: parentId,
        layoutOrder: [newLayoutId],
        rowIndex: parentLayout?.layout.length ?? 0,
      };
      const res: { canvasWidgets: CanvasWidgetsReduxState; newParent: any } =
        yield call(
          createParentAndAddWidget,
          widgets,
          highlight,
          parentId,
          index,
        );
      widgets = res.canvasWidgets;
      if (res.newParent) {
        parentId = res.newParent.widgetId;
        currentParent = res.newParent;
        parentLayout = getParentLayout(res.newParent);
        if (!parentLayout) throw new Error("Invalid parent layout");
        newLayoutId = parentLayout?.layoutId;
        isMainCanvas = currentParent.widgetId === MAIN_CONTAINER_WIDGET_ID;
        isSection = currentParent.type === anvilWidgets.SECTION_WIDGET;
      }
    }
  }
}

function getWidgetOrder(type: string, id: string): number {
  if (widgetTypes[type]) return widgetTypes[type];
  if (id === MAIN_CONTAINER_WIDGET_ID) return widgetTypes.MAIN_CANVAS;
  return widgetTypes.OTHER;
}

function splitWidgetsByOrder(
  widgets: CopiedWidgetData[],
): CopiedWidgetData[][] {
  const widgetOrders: CopiedWidgetData[][] = new Array(4).fill([]);
  widgets.forEach((widget: CopiedWidgetData) => {
    const order = getWidgetOrder(widget.list[0].type, widget.widgetId);
    widgetOrders[order].push(widget);
  });
  return widgetOrders;
}

function* createParentAndAddWidget(
  allWidgets: CanvasWidgetsReduxState,
  highlight: AnvilHighlightInfo,
  parentId: string,
  order: number,
) {
  let canvasWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  const newWidgetId: string = generateReactKey();
  switch (order) {
    case 1: {
      canvasWidgets = yield call(
        addNewWidgetAndUpdateLayout,
        canvasWidgets,
        newWidgetId,
        anvilWidgets.SECTION_WIDGET,
        parentId,
        highlight,
      );
      return { canvasWidgets, newParent: canvasWidgets[newWidgetId] };
    }
    case 2: {
      canvasWidgets = yield call(
        addNewWidgetAndUpdateLayout,
        canvasWidgets,
        newWidgetId,
        anvilWidgets.ZONE_WIDGET,
        parentId,
        highlight,
      );
      return { canvasWidgets, newParent: canvasWidgets[newWidgetId] };
    }
    default:
      return { canvasWidgets, newParent: null };
  }
}
