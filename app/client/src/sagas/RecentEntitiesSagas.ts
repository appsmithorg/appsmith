import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { all, put, takeLatest } from "redux-saga/effects";
import { updateRecentEntity } from "actions/globalSearchActions";

import {
  matchApiPath,
  matchDatasourcePath,
  matchQueryPath,
  matchBuilderPath,
  matchJSObjectPath,
} from "constants/routes";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { matchSaasPath } from "pages/Editor/SaaSEditor/constants";

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
    };

  const apiMatch = matchApiPath(pathName);
  if (apiMatch)
    return {
      type: "action",
      id: apiMatch?.params?.apiId,
      params: apiMatch?.params,
    };

  const queryMatch = matchQueryPath(pathName);
  if (queryMatch)
    return {
      type: "action",
      id: queryMatch.params?.queryId,
      params: queryMatch?.params,
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
  const { id, params, type } = getEntityInCurrentPath(
    action.payload.location.pathname,
  );
  if (type && id && id.indexOf(":") === -1) {
    yield put(updateRecentEntity({ type, id, params }));
  }
}

export default function* recentEntitiesSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SELECT_WIDGET_INIT, handleSelectWidget),
    takeLatest(ReduxActionTypes.HANDLE_PATH_UPDATED, handlePathUpdated),
  ]);
}
