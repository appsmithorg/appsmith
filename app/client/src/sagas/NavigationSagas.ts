import { all, call, put, select, takeEvery } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { getApiPaneSelectedTabIndex } from "selectors/apiPaneSelectors";
import { setFocusHistory } from "actions/focusHistoryActions";
import { matchPath } from "react-router";
import { API_EDITOR_ID_PATH, BUILDER_PATH_DEPRECATED } from "constants/routes";
import { setApiPaneSelectedTabIndex } from "actions/apiPaneActions";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";

let previousPath: string;

function* handleRouteChange(action: ReduxAction<{ pathname: string }>) {
  console.log("focus", previousPath, action);
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath);
  }
  yield call(setStateOfPath, action.payload.pathname);
  // restore old state for new path
  previousPath = action.payload.pathname;
}

export enum FocusEntity {
  API = "API",
  CANVAS = "CANVAS",
  QUERY = "QUERY",
}

const focusStateSelectors: Record<FocusEntity, any> = {
  CANVAS: [],
  QUERY: [],
  [FocusEntity.API]: [
    {
      name: "ApiPaneTab",
      selector: getApiPaneSelectedTabIndex,
      setter: setApiPaneSelectedTabIndex,
    },
  ],
};

function figureOutWithEntity(path: string): FocusEntity {
  const match = matchPath<{ apiId: string }>(path, {
    path: BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
  });
  if (match?.params.apiId) {
    return FocusEntity.API;
  }

  return FocusEntity.CANVAS;
}

function* storeStateOfPath(path: string) {
  const entity = figureOutWithEntity(path);
  const selectors = focusStateSelectors[entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  yield put(setFocusHistory(path, { entity, state }));
}

function* setStateOfPath(path: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const focusHistory: FocusState = yield select(getCurrentFocusInfo, path);
  console.log("focus", { focusHistory });

  if (focusHistory) {
    const selectors = focusStateSelectors[focusHistory.entity];
    console.log("focus", { selectors });
    for (const selectorInfo of selectors) {
      console.log("focus", { selectorInfo });
      yield put(selectorInfo.setter(focusHistory.state[selectorInfo.name]));
    }
  }

  console.log({ focus: "done" });
}

export default function* rootSaga() {
  yield all([takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange)]);
}
