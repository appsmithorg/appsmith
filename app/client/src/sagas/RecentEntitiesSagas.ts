import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { updateRecentEntity } from "actions/globalSearchActions";

import {
  matchApiPath,
  matchDatasourcePath,
  matchQueryPath,
  matchBuilderPath,
  matchJSObjectPath,
  JS_COLLECTION_ID_URL,
  API_EDITOR_ID_URL,
  QUERIES_EDITOR_ID_URL,
} from "constants/routes";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import {
  matchSaasPath,
  SAAS_EDITOR_API_ID_URL,
} from "pages/Editor/SaaSEditor/constants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction, getJSCollection } from "selectors/entitiesSelector";
import { JSCollection } from "entities/JSCollection";
import { Action, PluginType } from "entities/Action";
import { AppState } from "reducers";
import { apiIcon, jsIcon } from "pages/Editor/Explorer/ExplorerIcons";

export const getEntityInCurrentPath = (pathName: string) => {
  const builderMatch = matchBuilderPath(pathName);
  if (builderMatch)
    return {
      type: "page",
      id: builderMatch?.params?.pageId,
      params: builderMatch?.params,
    };

  const saasMatch = matchSaasPath(pathName);
  if (saasMatch)
    return {
      type: "action",
      id: saasMatch?.params?.apiId,
      params: saasMatch?.params,
      pluginType: PluginType.REMOTE,
    };

  const apiMatch = matchApiPath(pathName);
  if (apiMatch)
    return {
      type: "action",
      id: apiMatch?.params?.apiId,
      params: apiMatch?.params,
      pluginType: PluginType.API,
    };

  const queryMatch = matchQueryPath(pathName);
  if (queryMatch)
    return {
      type: "action",
      id: queryMatch.params?.queryId,
      params: queryMatch?.params,
      pluginType: PluginType.DB,
    };

  const datasourceMatch = matchDatasourcePath(pathName);
  if (datasourceMatch)
    return {
      type: "datasource",
      id: datasourceMatch?.params?.datasourceId,
      params: datasourceMatch?.params,
    };

  const jsObjectMatch = matchJSObjectPath(pathName);
  if (jsObjectMatch) {
    return {
      type: "jsAction",
      id: jsObjectMatch?.params?.collectionId,
      params: jsObjectMatch?.params,
    };
  }

  return {};
};

function* handleSelectWidget(action: ReduxAction<{ widgetId: string }>) {
  const builderMatch = matchBuilderPath(window.location.pathname);
  const { payload } = action;
  const selectedWidget = payload.widgetId;
  if (selectedWidget && selectedWidget !== MAIN_CONTAINER_WIDGET_ID)
    yield put(
      updateRecentEntity({
        type: "widget",
        id: selectedWidget,
        params: builderMatch?.params,
      }),
    );
}

function* handlePathUpdated(
  action: ReduxAction<{ location: typeof window.location }>,
) {
  const { id, params, pluginType, type } = getEntityInCurrentPath(
    action.payload.location.pathname,
  );
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string = yield select(getCurrentPageId);
  if (type && id && id.indexOf(":") === -1) {
    yield put(updateRecentEntity({ type, id, params }));
  }
  const editorTabs: [{ id: string; name: string; url: string }] = yield select(
    (state: AppState) => state.ui.editor.editorTabs,
  );

  if (editorTabs.find((tab) => tab.id === id)) return;

  if (type === "action") {
    const action: Action = yield select(getAction, id);
    const url =
      pluginType === PluginType.API
        ? API_EDITOR_ID_URL(applicationId, pageId, id)
        : pluginType === PluginType.DB
        ? QUERIES_EDITOR_ID_URL(applicationId, pageId, id)
        : SAAS_EDITOR_API_ID_URL(applicationId, pageId, "test", id);

    yield put({
      type: ReduxActionTypes.UPDATE_EDITOR_TABS,
      payload: { id, name: action?.name, url, icon: apiIcon },
    });
  } else if (type === "jsAction") {
    const js: JSCollection = yield select(getJSCollection, id);
    const url = JS_COLLECTION_ID_URL(applicationId, pageId, id);
    yield put({
      type: ReduxActionTypes.UPDATE_EDITOR_TABS,
      payload: { id, name: js?.name, url, icon: jsIcon },
    });
  }
}

export default function* recentEntitiesSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SELECT_WIDGET_INIT, handleSelectWidget),
    takeLatest(ReduxActionTypes.HANDLE_PATH_UPDATED, handlePathUpdated),
  ]);
}
