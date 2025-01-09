import type { AppState } from "ee/reducers";
import type { DSLWidget } from "WidgetProvider/constants";
import { focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import get from "lodash/get";
import log from "loglevel";
import { put, select, takeLatest } from "redux-saga/effects";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getWidget } from "sagas/selectors";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import {
  getFocusedParentToOpen,
  isWidgetSelected,
  shouldWidgetIgnoreClicksSelector,
} from "selectors/widgetSelectors";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import { NavigationMethod } from "utils/history";
import type { WidgetProps } from "widgets/BaseWidget";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { setActiveEditorField } from "actions/activeFieldActions";
import { setFocusablePropertyPaneField } from "actions/propertyPaneActions";
import { setEvalPopupState } from "actions/editorContextActions";
import type { ReduxAction } from "../../../../actions/ReduxActionTypes";

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

/**
 * A function that loops through all the entries in the error object and finds the first error path
 * @param errors The error object from evaluations
 * @param widget The widget in which the error occured
 * @returns The full property path of the property with the error
 */
function getErrorPropertyPath(
  errors: Record<string, Array<unknown>>,
  widget: DSLWidget,
) {
  for (const [key, value] of Object.entries(errors)) {
    if (value && value.length > 0) {
      return `${widget.widgetName}.${key}`;
    }
  }
}

// This is a stopgap measure until #33014 is resolved
export function* debugWidget(action: ReduxAction<{ widgetId: string }>) {
  const widgetId = action.payload.widgetId;
  const widget: DSLWidget = yield select(getWidget, widgetId);
  const widgetName: string = widget.widgetName;
  const errors: Record<string, Array<unknown>> = yield select(
    (state: AppState) =>
      get(state.evaluations.tree[widgetName], EVAL_ERROR_PATH, {}),
  );

  const fullPath = getErrorPropertyPath(errors, widget);

  if (fullPath && fullPath.length > 0) {
    yield put(setActiveEditorField(fullPath));
    yield put(setFocusablePropertyPaneField(fullPath));
    yield put(
      setEvalPopupState(fullPath, {
        type: false,
        value: true,
        example: false,
      }),
    );
  }
}

export default function* selectAnvilWidgetSaga() {
  yield takeLatest(AnvilReduxActionTypes.DEBUG_WIDGET, debugWidget);
  yield takeLatest(
    AnvilReduxActionTypes.ANVIL_WIDGET_SELECTION_CLICK,
    selectAnvilWidget,
  );
}
