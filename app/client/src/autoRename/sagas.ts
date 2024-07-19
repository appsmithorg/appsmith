import { all, put, select, takeLatest, delay } from "redux-saga/effects";

import { getWidgets } from "sagas/selectors";
import { objectKeys } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { UpdateWidgetPropertyPayload } from "actions/controlActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

import { WIDGET_NAME_MAP } from "./constants";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import type { Action, PluginType } from "entities/Action";
import { getNewEntityName } from "./utils";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import { updateWidgetName } from "actions/propertyPaneActions";

type AutoRenameActionSaga = ReduxAction<Record<string, unknown>>;
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
    yield delay(2000);
    // dispatch update widget name action
    yield put(updateWidgetName(widgetId, newName));
  }
}

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

export default function* autoRenameSagas() {
  yield all([
    takeLatest(
      [ReduxActionTypes.BATCH_UPDATE_MULTIPLE_WIDGETS_PROPERTY_SUCCESS],
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
