import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "./types";
import { getDestinedParent } from "./destinationUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { anvilWidgets } from "widgets/anvil/constants";
import type { LayoutProps } from "../anvilTypes";
import { all, call } from "redux-saga/effects";
import { addPastedWidgets } from "./utils";
import { handleWidgetMovement } from "layoutSystems/anvil/integrations/sagas/anvilDraggingSagas";
import { defaultHighlightRenderInfo } from "../constants";
import { pasteWidgetsIntoMainCanvas } from "./mainCanvasPasteUtils";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

export function* pasteWidgetsInSection(
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
   * Split copied widgets into zones and non-zones.
   */
  const [zones, nonZones] = splitWidgets(copiedWidgets);

  /**
   * Check for maxChildLimit of Section.
   * If maxChildLimit is reached, then paste extra widgets in a new section.
   */
  const layoutIndex = layoutOrder.length - 1;
  const targetLayout: LayoutProps = layoutOrder[layoutIndex];
  const targetRowIndex = rowIndex[layoutIndex] ?? 0;
  let count = targetLayout.layout.length;
  let zoneCount = 0;
  while (count < (targetLayout.maxChildLimit ?? 0)) {
    if (zones.length) {
      const zone = zones.shift();
      if (!zone) break;
      widgets = yield call(
        handleWidgetMovement,
        widgets,
        [map[zone.widgetId]],
        {
          ...defaultHighlightRenderInfo,
          alignment,
          canvasId: parent.widgetId,
          layoutId: targetLayout.layoutId,
          layoutOrder: layoutOrder
            .slice(0, layoutIndex + 1)
            .map((each: LayoutProps) => each.layoutId),
          rowIndex: targetRowIndex + zoneCount,
        },
        false,
        true,
      );
      count += 1;
      zoneCount += 1;
    } else if (nonZones.length) {
      widgets = yield call(
        handleWidgetMovement,
        widgets,
        nonZones.map((each: CopiedWidgetData) => map[each.widgetId]),
        {
          ...defaultHighlightRenderInfo,
          alignment,
          canvasId: parent.widgetId,
          layoutId: targetLayout.layoutId,
          layoutOrder: layoutOrder
            .slice(0, layoutIndex + 1)
            .map((each: LayoutProps) => each.layoutId),
          rowIndex: targetRowIndex + zoneCount,
        },
        false,
        true,
      );
      nonZones.splice(0, nonZones.length);
      count += 1;
    } else {
      break;
    }
  }

  if (zones.length || nonZones.length) {
    const info: PasteDestinationInfo = yield call(
      getDestinedParent,
      widgets,
      [...zones, ...nonZones],
      parent,
      parent.parentId ?? MAIN_CONTAINER_WIDGET_ID,
    );
    const res: PastePayload = yield call(
      pasteWidgetsIntoMainCanvas,
      widgets,
      [...zones, ...nonZones],
      info,
      map,
      reverseMap,
    );
    return res;
  }
  return { widgets, widgetIdMap: map, reverseWidgetIdMap: reverseMap };
}

export function splitWidgets(
  copiedWidgets: CopiedWidgetData[],
): CopiedWidgetData[][] {
  const zones: CopiedWidgetData[] = [];
  const nonZones: CopiedWidgetData[] = [];
  copiedWidgets.forEach((data: CopiedWidgetData) => {
    if (data.list[0].type === anvilWidgets.ZONE_WIDGET) {
      zones.push(data);
    } else {
      nonZones.push(data);
    }
  });
  return [zones, nonZones];
}
