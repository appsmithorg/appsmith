import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { CopiedWidgetData, PasteDestinationInfo } from "./types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { all, call } from "redux-saga/effects";
import { addPastedWidgets } from "./utils";
import { handleWidgetMovement } from "layoutSystems/anvil/integrations/sagas/anvilDraggingSagas";
import { defaultHighlightRenderInfo } from "../constants";
import type { LayoutProps } from "../anvilTypes";

export function* pasteWidgetsIntoMainCanvas(
  allWidgets: CanvasWidgetsReduxState,
  copiedWidgets: CopiedWidgetData[],
  destinationInfo: PasteDestinationInfo,
  widgetIdMap: Record<string, string>,
  reverseWidgetIdMap: Record<string, string>,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  let map: Record<string, string> = { ...widgetIdMap };
  let reverseMap: Record<string, string> = { ...reverseWidgetIdMap };
  const { alignment, layoutOrder, parentOrder, rowIndex } = destinationInfo;
  const parent: FlattenedWidgetProps =
    allWidgets[parentOrder[parentOrder.length - 1]];

  /**
   * Create copies of all widgets.
   */
  yield all(
    copiedWidgets.map((each: CopiedWidgetData) =>
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
          parent.widgetId,
        );

        widgets = res.widgets;
        map = res.map;
        reverseMap = res.reverseMap;
      }),
    ),
  );
  const layoutIndex = 0;
  const targetLayout: LayoutProps = layoutOrder[layoutIndex];
  const targetRowIndex = layoutOrder.length > 1 ? 1 : 0;

  const nonDetachedWidgets: CopiedWidgetData[] = copiedWidgets.filter(
    (each: CopiedWidgetData) => !each.list[0].detachFromLayout,
  );

  if (nonDetachedWidgets.length) {
    widgets = yield call(
      handleWidgetMovement,
      widgets,
      nonDetachedWidgets.map((each: CopiedWidgetData) => map[each.widgetId]),
      {
        ...defaultHighlightRenderInfo,
        alignment,
        canvasId: parent.widgetId,
        layoutId: targetLayout.layoutId,
        layoutOrder: layoutOrder
          .slice(0, layoutIndex + 1)
          .map((each: LayoutProps) => each.layoutId),
        rowIndex: rowIndex[targetRowIndex],
      },
      true,
      false,
    );
  }

  return { widgets, widgetIdMap: map, reverseWidgetIdMap: reverseMap };
}
