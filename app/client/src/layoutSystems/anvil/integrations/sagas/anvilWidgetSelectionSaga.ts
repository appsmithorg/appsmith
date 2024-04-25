import {
  ReduxActionTypes,
  type ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import { focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import log from "loglevel";
import { put, select, takeLatest } from "redux-saga/effects";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import {
  getFocusedParentToOpen,
  isWidgetSelected,
  shouldWidgetIgnoreClicksSelector,
} from "selectors/widgetSelectors";
import { NavigationMethod } from "utils/history";
import type { WidgetProps } from "widgets/BaseWidget";
import { getWidgetErrorObject } from "../selectors";
import { getWidget } from "sagas/selectors";
import type { DSLWidget } from "WidgetProvider/constants";

/**
 * This saga selects widgets in the Anvil Layout system
 * It is triggered by a custom event dispatched by all widgets on click
 * @param action The widgetId and the event object for the click that resulted in the call to this saga
 * @returns
 */
export function* selectAnvilWidget(
  action: ReduxAction<{ widgetId: string; e: CustomEvent }>,
) {
  const start = performance.now();
  const { e, widgetId } = action.payload;
  const {
    detail: { ctrlKey, metaKey, shiftKey },
  } = e;

  const isPropPaneVisible: boolean = yield select(getIsPropertyPaneVisible);
  const isWidgetAlreadySelected: boolean = yield select(
    isWidgetSelected(widgetId),
  );
  const parentWidgetToOpen: WidgetProps = yield select(getFocusedParentToOpen);
  const shouldIgnoreClicks: boolean = yield select(
    shouldWidgetIgnoreClicksSelector(widgetId),
  );

  // The following code has been copied from `useWidgetSelection` hook.
  // In the event of any changes to the hook, this code needs to be updated as well.
  // TODO(#30582): Refactor this code to a common function and use it in both places.
  if (shouldIgnoreClicks) return;
  if (
    (!isPropPaneVisible && isWidgetAlreadySelected) ||
    !isWidgetAlreadySelected
  ) {
    let type: SelectionRequestType = SelectionRequestType.One;
    if (metaKey || ctrlKey) {
      type = SelectionRequestType.PushPop;
    } else if (shiftKey) {
      type = SelectionRequestType.ShiftSelect;
    }

    if (parentWidgetToOpen) {
      yield put(
        selectWidgetInitAction(
          type,
          [parentWidgetToOpen.widgetId],
          NavigationMethod.CanvasClick,
        ),
      );
    } else {
      yield put(
        selectWidgetInitAction(type, [widgetId], NavigationMethod.CanvasClick),
      );
      yield put(focusWidget(widgetId));
    }

    if (
      type === SelectionRequestType.PushPop ||
      type === SelectionRequestType.ShiftSelect
    ) {
      e.stopPropagation();
    }
  }
  log.debug("Time taken to select widget", performance.now() - start, "ms");
}

//TODO(abhinav): Speak to the IDE pod and move this appropriately.
export function* debugWidget(action: ReduxAction<{ widgetId: string }>) {
  const widgetId = action.payload.widgetId;
  const errors: Record<string, Array<unknown>> = yield select(
    (state: AppState) => getWidgetErrorObject(state, widgetId),
  );
  const widget: DSLWidget = yield select(getWidget, widgetId);
  let firstErrorFieldPath = "";
  const errorValues = Object.values(errors);
  const totalKeys = errorValues.length;
  let index = 0;
  while (index < totalKeys && firstErrorFieldPath.length === 0) {
    if (errorValues[index] && errorValues[index].length > 0) {
      firstErrorFieldPath = Object.keys(errors)[index];
    }
    index++;
  }

  Object.values(errors).forEach((error: Array<unknown>, index: number) => {
    if (error && error.length > 0) {
      firstErrorFieldPath = Object.keys(errors)[index];
    }
  });
  const fullPath = `${widget.widgetName}.${firstErrorFieldPath}`;
  yield put({
    type: ReduxActionTypes.SET_ACTIVE_EDITOR_FIELD,
    payload: { field: fullPath },
  });
  yield put({
    type: ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD,
    payload: { path: fullPath },
  });
  yield put({
    type: ReduxActionTypes.SET_EVAL_POPUP_STATE,
    payload: {
      key: fullPath,
      evalPopupState: {
        type: false,
        value: true,
        example: false,
      },
    },
  });
}

export default function* selectAnvilWidgetSaga() {
  yield takeLatest("ANVIL_WIDGET_SELECTION_CLICK", selectAnvilWidget);
  yield takeLatest("DEBUG_WIDGET", debugWidget);
}
