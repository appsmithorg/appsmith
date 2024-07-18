import { all, put, select, takeLatest } from "redux-saga/effects";

import { getWidgets } from "sagas/selectors";
import { objectKeys } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { UpdateWidgetPropertyPayload } from "actions/controlActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

import { WIDGET_NAME_MAP } from "./constants";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import type { Action } from "entities/Action";
import { getNewEntityName } from "./utils";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";

type AutoRenameActionSaga = ReduxAction<Record<string, unknown>>;
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
  let actionConfiguration = action.payload.actionConfiguration;
  if (!actionConfiguration) {
    const actionObject: Action = yield select(
      getAction,
      action.payload.id as string,
    );
    actionConfiguration = actionObject.actionConfiguration;
  }

  // if (!shouldUpdateEntityName(ENTITY_TYPE, actionConfiguration)) return;

  const newActionName: string = yield getNewEntityName(
    ENTITY_TYPE.ACTION,
    actionConfiguration as Record<string, unknown>,
  );

  yield put({
    type: ReduxActionTypes.SAVE_ACTION_NAME_INIT,
    payload: {
      id: action.payload.id,
      name: newActionName,
    },
  });
}

export default function* autoRenameSagas() {
  yield all([
    takeLatest(
      [ReduxActionTypes.BATCH_UPDATE_MULTIPLE_WIDGETS_PROPERTY],
      autoRenameWidgetSaga,
    ),
    takeLatest(
      [
        ReduxActionTypes.RUN_ACTION_REQUEST,
        ReduxActionTypes.CREATE_ACTION_SUCCESS,
      ],
      autoRenameActionSaga,
    ),
  ]);
}
