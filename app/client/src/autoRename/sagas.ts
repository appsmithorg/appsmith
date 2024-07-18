import { all, select, takeLatest } from "redux-saga/effects";

import { getWidgets } from "sagas/selectors";
import { objectKeys } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type {
  EvaluationReduxAction,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import type { UpdateWidgetPropertyPayload } from "actions/controlActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

import { ACTION_NAME_MAP, WIDGET_NAME_MAP } from "./constants";
import type { SetActionPropertyPayload } from "actions/pluginActionActions";

type AutoRenameActionSaga = EvaluationReduxAction<SetActionPropertyPayload>;
type AutoRenameWidgetSaga = ReduxAction<{
  updatesArray: UpdateWidgetPropertyPayload[];
}>;

function* autoRenameWidgetSaga(action: AutoRenameWidgetSaga) {
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  action.payload.updatesArray.forEach((update) => {
    const { widgetId } = update;
    const widget = canvasWidgets[widgetId] as WidgetProps;
    const propsToConsider = WIDGET_NAME_MAP[widget.type];

    if (!update.updates.modify) return;

    const modifiedProps = objectKeys(update.updates.modify);

    modifiedProps.forEach((prop) => {
      if (propsToConsider.includes(prop)) {
        // call getNewEntityname here
      }
    });
  });
}

function* autoRenameActionSaga(action: AutoRenameActionSaga) {
  if (ACTION_NAME_MAP.includes(action.payload.propertyName)) {
    // call getNewEntityname here
  }
}

export default function* autoRenameSagas() {
  yield all([
    takeLatest(
      [ReduxActionTypes.BATCH_UPDATE_MULTIPLE_WIDGETS_PROPERTY],
      autoRenameWidgetSaga,
    ),
    takeLatest([ReduxActionTypes.SET_ACTION_PROPERTY], autoRenameActionSaga),
  ]);
}
