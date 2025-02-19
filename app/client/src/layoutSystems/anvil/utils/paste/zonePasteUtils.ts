import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { CopiedWidgetData, PasteDestinationInfo } from "./types";
import type {
  AnvilConfig,
  FlattenedWidgetProps,
} from "WidgetProvider/constants";
import type { LayoutProps } from "../anvilTypes";
import { all, call } from "redux-saga/effects";
import { addPastedWidgets } from "./utils";
import WidgetFactory from "WidgetProvider/factory";
import { handleWidgetMovement } from "layoutSystems/anvil/integrations/sagas/anvilDraggingSagas";
import { defaultHighlightRenderInfo } from "../constants";

export function* pasteWidgetsInZone(
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

  /**
   * Split large and small widgets.
   */
  const { largeWidgets, smallWidgets } = splitWidgets(copiedWidgets);

  /**
   * Add widgets to latest target layout.
   */
  let layoutIndex = layoutOrder.length - 1;
  let targetRowIndex = rowIndex.length - 1;
  let targetLayout: LayoutProps = layoutOrder[layoutIndex];
  let currentRowIndex = rowIndex[targetRowIndex] ?? 0;
  const maxChildLimitMet: boolean =
    targetLayout.maxChildLimit !== undefined &&
    targetLayout.maxChildLimit > 0 &&
    targetLayout.layout.length >= targetLayout.maxChildLimit;

  if (maxChildLimitMet) {
    /**
     * If maxChildLimit of current layout has been reached.
     * => Add to the next layout higher up in hierarchy.
     */
    layoutIndex -= 1;
    targetRowIndex -= 1;
    targetLayout = layoutOrder[layoutIndex];
    currentRowIndex = rowIndex[targetRowIndex];
  }

  if (smallWidgets.length) {
    /**
     * All small widgets can be added together.
     */
    widgets = yield call(
      handleWidgetMovement,
      widgets,
      smallWidgets.map((each: CopiedWidgetData) => map[each.widgetId]),
      {
        ...defaultHighlightRenderInfo,
        alignment,
        canvasId: parent.widgetId,
        layoutId: targetLayout.layoutId,
        layoutOrder: layoutOrder
          .slice(0, layoutIndex + 1)
          .map((each: LayoutProps) => each.layoutId),
        rowIndex: currentRowIndex,
      },
      false,
      false,
    );
  }

  if (largeWidgets.length) {
    /**
     * There can only be one large widget per row.
     * So each of them are added in new rows.
     */
    if (targetLayout.allowedWidgetTypes?.includes("SMALL_WIDGETS")) {
      layoutIndex -= 1;
      targetRowIndex -= 1;
      targetLayout = layoutOrder[layoutIndex];
      currentRowIndex = rowIndex[targetRowIndex];
    }

    const extraRow = smallWidgets.length > 0 && maxChildLimitMet ? 1 : 0;

    yield all(
      largeWidgets.map((each: CopiedWidgetData, index: number) =>
        call(function* () {
          widgets = yield call(
            handleWidgetMovement,
            widgets,
            [map[each.widgetId]],
            {
              ...defaultHighlightRenderInfo,
              alignment,
              canvasId: parent.widgetId,
              layoutId: targetLayout.layoutId,
              layoutOrder: layoutOrder
                .slice(0, layoutIndex + 1)
                .map((each: LayoutProps) => each.layoutId),
              rowIndex: currentRowIndex + index + extraRow,
            },
            false,
            false,
          );
        }),
      ),
    );
  }

  return { widgets, widgetIdMap: map, reverseWidgetIdMap: reverseMap };
}

function splitWidgets(copiedWidgets: CopiedWidgetData[]): {
  smallWidgets: CopiedWidgetData[];
  largeWidgets: CopiedWidgetData[];
} {
  const smallWidgets: CopiedWidgetData[] = [];
  const largeWidgets: CopiedWidgetData[] = [];

  copiedWidgets.forEach((each: CopiedWidgetData) => {
    const anvilConfig: AnvilConfig = WidgetFactory.getWidgetAnvilConfig(
      each.list[0].type,
    );

    if (anvilConfig.isLargeWidget) {
      largeWidgets.push(each);
    } else {
      smallWidgets.push(each);
    }
  });

  return { smallWidgets, largeWidgets };
}
