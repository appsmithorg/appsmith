import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLeading } from "redux-saga/effects";
import { getSelectedWidgetWhenPasting } from "sagas/WidgetOperationUtils";
import { getWidgets } from "sagas/selectors";
import { updateAndSaveAnvilLayout } from "../../../utils/anvilChecksUtils";
import { builderURL } from "ee/RouteBuilder";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "actions/ReduxActionTypes";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import history from "utils/history";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "../../../utils/paste/types";
import { getCopiedWidgets } from "utils/storage";
import { getDestinedParent } from "layoutSystems/anvil/utils/paste/destinationUtils";
import { pasteWidgetsIntoMainCanvas } from "layoutSystems/anvil/utils/paste/mainCanvasPasteUtils";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import WidgetFactory from "WidgetProvider/factory";
import { getIsAnvilLayout } from "../../selectors";
import { widgetHierarchy } from "layoutSystems/anvil/utils/constants";

function* pasteAnvilModalWidgets(
  allWidgets: CanvasWidgetsReduxState,
  modalWidgetsToPaste: CopiedWidgetData[],
) {
  const lastDestinationInfo: PasteDestinationInfo = yield call(
    getDestinedParent,
    allWidgets,
    modalWidgetsToPaste,
    allWidgets[MAIN_CONTAINER_WIDGET_ID],
  );

  // paste into main canvas
  const res: PastePayload = yield call(
    pasteWidgetsIntoMainCanvas,
    allWidgets,
    modalWidgetsToPaste,
    lastDestinationInfo,
    {},
    {},
  );

  return res;
}

export function* pasteWidgetSagas() {
  try {
    const {
      widgets: copiedWidgets,
    }: {
      widgets: CopiedWidgetData[];
    } = yield getCopiedWidgets();

    if (!copiedWidgets.length) return;

    const modalWidgets = copiedWidgets.filter(
      (widget) => widget.hierarchy === widgetHierarchy.WDS_MODAL_WIDGET,
    );
    const nonModalWidgets = copiedWidgets.filter(
      (widget) => widget.hierarchy !== widgetHierarchy.WDS_MODAL_WIDGET,
    );
    const originalWidgets: CopiedWidgetData[] = [...nonModalWidgets];

    const selectedWidget: FlattenedWidgetProps =
      yield getSelectedWidgetWhenPasting();

    if (!selectedWidget) return;

    let allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    const destinationInfo: PasteDestinationInfo = yield call(
      getDestinedParent,
      allWidgets,
      copiedWidgets,
      selectedWidget,
    );

    /**
     * Track mapping between original and new widgetIds.
     */
    let widgetIdMap: Record<string, string> = {};
    let reverseWidgetIdMap: Record<string, string> = {};

    const parent: FlattenedWidgetProps =
      allWidgets[
        destinationInfo.parentOrder[destinationInfo.parentOrder.length - 1]
      ];

    if (parent.widgetId === MAIN_CONTAINER_WIDGET_ID) {
      const res: PastePayload = yield call(
        pasteWidgetsIntoMainCanvas,
        allWidgets,
        originalWidgets,
        destinationInfo,
        widgetIdMap,
        reverseWidgetIdMap,
      );

      allWidgets = res.widgets;
      widgetIdMap = res.widgetIdMap;
      reverseWidgetIdMap = res.reverseWidgetIdMap;
    } else {
      const res: PastePayload = yield call(
        WidgetFactory.performPasteOperation,
        allWidgets,
        originalWidgets,
        destinationInfo,
        widgetIdMap,
        reverseWidgetIdMap,
      );

      allWidgets = res.widgets;
      widgetIdMap = res.widgetIdMap;
      reverseWidgetIdMap = res.reverseWidgetIdMap;
    }

    if (modalWidgets.length > 0) {
      // paste into main canvas
      const res: PastePayload = yield call(
        pasteAnvilModalWidgets,
        allWidgets,
        modalWidgets,
      );

      allWidgets = res.widgets;
      widgetIdMap = { ...widgetIdMap, ...res.widgetIdMap };
      reverseWidgetIdMap = { ...reverseWidgetIdMap, ...res.reverseWidgetIdMap };
    }

    /**
     * Save state
     */
    yield call(updateAndSaveAnvilLayout, allWidgets);

    const basePageId: string = yield select(getCurrentBasePageId);

    if (originalWidgets?.length) {
      history.push(builderURL({ basePageId }));
    }

    const widgetsToSelect = copiedWidgets.map(
      (each: CopiedWidgetData) => widgetIdMap[each.widgetId],
    );

    yield put({
      type: ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
      payload: Object.values(widgetIdMap),
    });

    yield put(
      selectWidgetInitAction(SelectionRequestType.Multiple, widgetsToSelect),
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
        error,
        logToDebugger: true,
      },
    });
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* shouldCallSaga(saga: any, action: ReduxAction<unknown>) {
  const isAnvilLayout: boolean = yield select(getIsAnvilLayout);

  if (isAnvilLayout) {
    yield call(saga, action);
  }
}

export default function* pasteSagas() {
  yield all([
    takeLeading(
      ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
      shouldCallSaga,
      pasteWidgetSagas,
    ),
  ]);
}
