import { all, call, put, select, takeEvery } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { setFocusHistory } from "actions/focusHistoryActions";
import { matchPath } from "react-router";
import {
  API_EDITOR_ID_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "constants/routes";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { FocusEntity, FocusElementsConfig } from "navigation/FocusElements";

let previousPath: string;

function* handleRouteChange(action: ReduxAction<{ pathname: string }>) {
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath);
  }
  yield call(setStateOfPath, action.payload.pathname);
  // restore old state for new path
  previousPath = action.payload.pathname;
}

function figureOutWithEntity(path: string): FocusEntity {
  const match = matchPath<{ apiId: string }>(path, {
    path: BUILDER_PATH + API_EDITOR_ID_PATH,
  });
  if (match?.params.apiId) {
    return FocusEntity.API;
  }
  // TODO for other focus entities

  return FocusEntity.CANVAS;
}

function* storeStateOfPath(path: string) {
  const entity = figureOutWithEntity(path); // TODO entity found reuse in existing keys
  const selectors = FocusElementsConfig[entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  console.log({ focus: { state, entity, path } });
  yield put(setFocusHistory(path, { entity, state }));
}

function* setStateOfPath(path: string) {
  const focusHistory: FocusState = yield select(getCurrentFocusInfo, path);

  if (focusHistory) {
    const selectors = FocusElementsConfig[focusHistory.entity];
    for (const selectorInfo of selectors) {
      yield put(selectorInfo.setter(focusHistory.state[selectorInfo.name]));
    }
  } else {
    const entity = figureOutWithEntity(path);
    const selectors = FocusElementsConfig[entity];
    for (const selectorInfo of selectors) {
      if ("defaultValue" in selectorInfo)
        yield put(selectorInfo.setter(selectorInfo.defaultValue));
    }
  }
}

export default function* rootSaga() {
  yield all([takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange)]);
}
