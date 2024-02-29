import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { LayoutSystemTypes } from "layoutSystems/types";
import log from "loglevel";
import { put, select, takeLatest } from "redux-saga/effects";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import {
  getFocusedParentToOpen,
  isWidgetSelected,
  shouldWidgetIgnoreClicksSelector,
} from "selectors/widgetSelectors";
import { NavigationMethod } from "utils/history";
import type { WidgetProps } from "widgets/types";

/**
 * This saga selects widgets in the Anvil Layout system
 * It is triggered by a custom event dispatched by all widgets on click
 * @param action The widgetId and the event object for the click that resulted in the call to this saga
 * @returns
 */
export function* selectAnvilWidget(
  action: ReduxAction<{ widgetId: string; e: PointerEvent }>,
) {
  const start = performance.now();
  const { e, widgetId } = action.payload;

  const isPropPaneVisible: boolean = yield select(getIsPropertyPaneVisible);
  const isWidgetAlreadySelected: boolean = yield select(
    isWidgetSelected(widgetId),
  );
  const parentWidgetToOpen: WidgetProps = yield select(getFocusedParentToOpen);
  const shouldIgnoreClicks: boolean = yield select(
    shouldWidgetIgnoreClicksSelector(widgetId),
  );

  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);

  // The following code has been copied from `useWidgetSelection` hook.
  // In the event of any changes to the hook, this code needs to be updated as well.
  // TODO(#30582): Refactor this code to a common function and use it in both places.
  if (shouldIgnoreClicks) return;
  if (
    (!isPropPaneVisible && isWidgetAlreadySelected) ||
    !isWidgetAlreadySelected
  ) {
    let type: SelectionRequestType = SelectionRequestType.One;
    if (e.metaKey || e.ctrlKey || (layoutSystemType && e.shiftKey)) {
      type = SelectionRequestType.PushPop;
    } else if (e.shiftKey) {
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

export default function* selectAnvilWidgetSaga() {
  yield takeLatest("ANVIL_WIDGET_SELECTION_CLICK", selectAnvilWidget);
}
