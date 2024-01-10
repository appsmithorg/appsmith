import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { CopiedWidgetData } from "./types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  addPastedWidgets,
  getContainingLayoutMapping,
  getParentLayout,
} from "./utils";
import { all, call } from "redux-saga/effects";
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
import { addNewWidgetAndUpdateLayout } from "./widgetUtils";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

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
  widgetIdMap: Record<string, string>,
  reverseWidgetIdMap: Record<string, string>,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  let map: Record<string, string> = { ...widgetIdMap };
  let reverseMap: Record<string, string> = { ...reverseWidgetIdMap };

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

    if (widgetsToAdd.length) {
      yield all(
        widgetsToAdd.map((each: CopiedWidgetData) =>
          call(function* () {
            /**
             * Create a new version of copied widget.
             */
            const res: {
              map: Record<string, string>;
              reverseMap: Record<string, string>;
              widgets: CanvasWidgetsReduxState;
            } = yield call(
              addPastedWidgets,
              each,
              widgets,
              map,
              reverseMap,
              parentId,
            );
            widgets = res.widgets;
            map = res.map;
            reverseMap = res.reverseMap;
          }),
        ),
      );

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
            parentLayout.layout.length - 1
          ].hasOwnProperty("layoutId")
            ? (parentLayout?.layout[rowIndex] as LayoutProps)?.layoutId
            : "";
        }
      }
    }

    /**
     * All members of this order have been pasted.
     * Check if there are any widgets in the next lower order,
     * if true => create a new widget of this order and use it as the parent for the next order.
     */
    if (doLowerOrdersHaveEntries(index, order)) {
      const highlight: AnvilHighlightInfo = {
        ...defaultHighlightRenderInfo,
        alignment: FlexLayerAlignment.Start, // TODO: remove this hard coding
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

    // Update index.
    index += 1;
  }

  return { widgets, map, reverseMap };
}

function getWidgetOrder(type: string, id: string): number {
  if (widgetTypes[type]) return widgetTypes[type];
  if (id === MAIN_CONTAINER_WIDGET_ID) return widgetTypes.MAIN_CANVAS;
  return widgetTypes.OTHER;
}

function splitWidgetsByOrder(
  widgets: CopiedWidgetData[],
): CopiedWidgetData[][] {
  const widgetOrders: CopiedWidgetData[][] = [[], [], [], []];
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
    case widgetTypes[anvilWidgets.SECTION_WIDGET]: {
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
    case widgetTypes[anvilWidgets.ZONE_WIDGET]: {
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

function doLowerOrdersHaveEntries(
  index: number,
  order: CopiedWidgetData[][],
): boolean {
  for (let i = index + 1; i < order.length; i += 1) {
    if (order[i].length) return true;
  }
  return false;
}
