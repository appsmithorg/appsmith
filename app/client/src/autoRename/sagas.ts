import { all, put, select, takeLatest, delay } from "redux-saga/effects";

import type { WidgetProps } from "widgets/BaseWidget";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

import { getAction } from "@appsmith/selectors/entitiesSelector";
import type { Action, PluginType } from "entities/Action";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import { updateWidgetName } from "actions/propertyPaneActions";

import { getNewEntityName } from "./utils";

type AutoRenameActionSaga = ReduxAction<Record<string, unknown>>;

function* autoRenameActionSaga(action: AutoRenameActionSaga) {
  let actionConfiguration = action.payload.actionConfiguration;
  let pluginType = action.payload.pluginType as PluginType | undefined;
  let name = action.payload.name;
  if (!actionConfiguration || !pluginType || !name) {
    const actionObject: Action = yield select(
      getAction,
      action.payload.id as string,
    );
    actionConfiguration = actionObject.actionConfiguration;
    pluginType = actionObject.pluginType;
    name = actionObject.name;
  }

  // if (!shouldUpdateEntityName(ENTITY_TYPE, actionConfiguration)) return;

  const newActionName: string = yield getNewEntityName(ENTITY_TYPE.ACTION, {
    ...(actionConfiguration as Record<string, unknown>),
    pluginType,
    name,
  });

  yield put({
    type: ReduxActionTypes.SAVE_ACTION_NAME_INIT,
    payload: {
      id: action.payload.id,
      name: newActionName,
    },
  });
}

function* autoRenameWidgetSaga(reduxAction: ReduxAction<any>) {
  let shouldRename = false;

  const updatedWidgetId = reduxAction.payload.updatedWidgetIds[0];
  const widget = reduxAction.payload.widgets[updatedWidgetId] as WidgetProps;
  const prevWidgetName = widget.widgetName;
  const generatedName: string = yield getNewEntityName("WIDGET", widget);

  if (prevWidgetName !== generatedName) {
    shouldRename = true;
  }

  if (shouldRename) {
    yield delay(1000);
    // dispatch update widget name action
    yield put(updateWidgetName(updatedWidgetId, generatedName));
  }
}

export default function* autoRenameSagas() {
  yield all([
    takeLatest(
      [
        ReduxActionTypes.RUN_ACTION_REQUEST,
        ReduxActionTypes.CREATE_ACTION_SUCCESS,
      ],
      autoRenameActionSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_LAYOUT, autoRenameWidgetSaga),
  ]);
}
