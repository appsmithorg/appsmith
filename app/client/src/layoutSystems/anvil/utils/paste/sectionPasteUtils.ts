import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "./types";
import { getDestinedParent } from "./destinationUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { anvilWidgets } from "modules/ui-builder/ui/wds/constants";
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
   * Split copied widgets into zones and non-zones.
   */
  const [zones, nonZones] = splitWidgets(copiedWidgets);

  /**
   * Check for maxChildLimit of Section.
   * If maxChildLimit is reached, then paste extra widgets in a new section.
   */
  const parentLayout: LayoutProps = layoutOrder[layoutOrder.length - 1];
  const availableSlots: number =
    parentLayout.maxChildLimit !== undefined && parentLayout.maxChildLimit > 0
      ? parentLayout.maxChildLimit - parentLayout.layout.length
      : -1;

  // Copied widgets can either be zones or non-zones. Not both.
  const areZones: boolean = zones.length > 0;

  /**
   * Split copied widgets into children and foreign children.
   * 1. children will be added to current section.
   * 2. foreign children will be added to a new section.
   */
  const children: CopiedWidgetData[] = [],
    foreignChildren: CopiedWidgetData[] = [];

  if (availableSlots <= 0) {
    foreignChildren.push(...(areZones ? zones : nonZones));
  } else {
    if (areZones) {
      children.push(...zones.slice(0, availableSlots));
      foreignChildren.push(...zones.slice(availableSlots));
    } else {
      children.push(...nonZones);
    }
  }

  /**
   * Create copies of all widgets.
   */
  yield all(
    children.map((each: CopiedWidgetData) =>
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

  const layoutIndex = layoutOrder.length - 1;
  const targetLayout: LayoutProps = layoutOrder[layoutIndex];
  const targetRowIndex = rowIndex[rowIndex.length - 1] ?? 0;
  let count = targetLayout.layout.length;
  let zoneCount = 0;

  while (count < (targetLayout.maxChildLimit ?? 0)) {
    if (areZones) {
      const zone = children.shift();

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
    } else {
      /**
       * All non zone widgets can be added together in a single zone.
       */
      widgets = yield call(
        handleWidgetMovement,
        widgets,
        children.map((each: CopiedWidgetData) => map[each.widgetId]),
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
      break;
    }
  }

  /**
   * Add foreignChildren to the MainCanvas,
   * which will automatically create a new Section.
   */
  if (foreignChildren.length) {
    const info: PasteDestinationInfo = yield call(
      getDestinedParent,
      widgets,
      foreignChildren,
      parent,
      parent.parentId ?? MAIN_CONTAINER_WIDGET_ID,
    );
    const res: PastePayload = yield call(
      pasteWidgetsIntoMainCanvas,
      widgets,
      foreignChildren,
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
