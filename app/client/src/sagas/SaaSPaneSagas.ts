import { all, select, takeEvery } from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import history from "utils/history";
import { getPlugin } from "selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";
import {
  SAAS_EDITOR_DATASOURCE_ID_URL,
  SAAS_EDITOR_API_ID_URL,
} from "pages/Editor/SaaSEditor/constants";

import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { Action } from "entities/Action";

function* handleDatasourceCreatedSaga(actionPayload: ReduxAction<Datasource>) {
  const plugin = yield select(getPlugin, actionPayload.payload.pluginId);
  // Only look at SAAS plugins
  if (plugin.type !== "SAAS") return;

  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);

  history.push(
    SAAS_EDITOR_DATASOURCE_ID_URL(
      applicationId,
      pageId,
      plugin.packageName,
      actionPayload.payload.id,
    ),
  );
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { id, pluginId } = actionPayload.payload;
  const plugin = yield select(getPlugin, pluginId);

  if (plugin.type !== "SAAS") return;
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  history.push(
    SAAS_EDITOR_API_ID_URL(applicationId, pageId, plugin.packageName, id, {
      editName: "true",
    }),
  );
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
      handleDatasourceCreatedSaga,
    ),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
  ]);
}
