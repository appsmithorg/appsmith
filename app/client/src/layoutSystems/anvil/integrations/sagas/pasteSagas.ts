import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLeading } from "redux-saga/effects";
import { getSelectedWidgetWhenPasting } from "sagas/WidgetOperationUtils";
import { getWidgets } from "sagas/selectors";
import { updateAndSaveAnvilLayout } from "../../utils/anvilChecksUtils";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import history from "utils/history";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "../../utils/paste/types";
import { getCopiedWidgets } from "utils/storage";
import { getDestinedParent } from "layoutSystems/anvil/utils/paste/destinationUtils";
import { pasteWidgetsIntoMainCanvas } from "layoutSystems/anvil/utils/paste/mainCanvasPasteUtils";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import WidgetFactory from "WidgetProvider/factory";
import { getIsAnvilLayout } from "../selectors";

function* pasteWidgetSagas() {
  try {
    const {
      widgets: copiedWidgets,
    }: {
      widgets: CopiedWidgetData[];
    } = yield getCopiedWidgets();
    const originalWidgets: CopiedWidgetData[] = [...copiedWidgets];

    if (!originalWidgets.length) return;

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

    /**
     * Save state
     */
    yield call(updateAndSaveAnvilLayout, allWidgets);

    const pageId: string = yield select(getCurrentPageId);

    if (originalWidgets?.length) {
      history.push(builderURL({ pageId }));
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
      },
    });
  }
}

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
