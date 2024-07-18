import { all, put, select, takeLatest } from "redux-saga/effects";

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
import { saveActionName } from "actions/pluginActionActions";
import { getNewEntityName } from "./utils";
import { updateWidgetName } from "actions/propertyPaneActions";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import type { Action } from "entities/Action";

type AutoRenameActionSaga = EvaluationReduxAction<SetActionPropertyPayload>;
type AutoRenameWidgetSaga = ReduxAction<{
  updatesArray: UpdateWidgetPropertyPayload[];
}>;

function* autoRenameWidgetSaga(reduxAction: AutoRenameWidgetSaga) {
  let shouldRename = false;
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  reduxAction.payload.updatesArray.forEach((update) => {
    const { widgetId } = update;
    const widget = canvasWidgets[widgetId] as WidgetProps;
    const propsToConsider = WIDGET_NAME_MAP[widget.type];

    if (!update.updates.modify) return;

    const modifiedProps = objectKeys(update.updates.modify);

    modifiedProps.forEach((prop) => {
      if (propsToConsider.includes(prop)) {
        shouldRename = true;
      }
    });
  });

  if (shouldRename) {
    const widgetId = reduxAction.payload.updatesArray[0].widgetId;
    const widget = canvasWidgets[widgetId] as WidgetProps;

    const newName: string = yield getNewEntityName("WIDGET", widget);

    // dispatch update widget name action
    yield put(updateWidgetName(widgetId, newName));
  }
}

function* autoRenameActionSaga(reduxAction: AutoRenameActionSaga) {
  const { actionId, propertyName } = reduxAction.payload;
  const action: Action = yield select(getAction, actionId);

  if (ACTION_NAME_MAP.includes(reduxAction.payload.propertyName)) {
    const newName: string = yield getNewEntityName("ACTION", {
      action,
      propertyName,
    });

    // dispatch update action name action
    yield put(saveActionName({ id: actionId, name: newName }));
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
