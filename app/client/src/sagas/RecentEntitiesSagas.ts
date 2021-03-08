import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { all, put, takeLatest } from "redux-saga/effects";
import { updateRecentEntity } from "actions/globalSearchActions";

import {
  matchApiPath,
  matchDatasourcePath,
  matchQueryPath,
  matchBuilderPath,
} from "constants/routes";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

const getRecentEntity = (pathName: string) => {
  const builderMatch = matchBuilderPath(pathName);
  if (builderMatch)
    return {
      type: "page",
      id: builderMatch?.params?.pageId,
      params: builderMatch?.params,
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

function* handlePathUpdated(action: ReduxAction<{ pathName: string }>) {
  const { type, id, params } = getRecentEntity(action.payload.pathName);
  if (type && id && id.indexOf(":") === -1) {
    yield put(updateRecentEntity({ type, id, params }));
  }
}

export default function* recentEntitiesSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SELECT_WIDGET, handleSelectWidget),
    takeLatest(ReduxActionTypes.HANDLE_PATH_UPDATED, handlePathUpdated),
  ]);
}
