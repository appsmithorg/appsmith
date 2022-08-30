import { all, call, put, select, takeEvery } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { setFocusHistory } from "actions/focusHistoryActions";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { FocusElementsConfig } from "navigation/FocusElements";
import { identifyEntityFromPath, FocusEntity } from "navigation/FocusEntity";

let previousPath: string;
let previousHash: string;

function* handleRouteChange(
  action: ReduxAction<{ pathname: string; hash: string }>,
) {
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath, previousHash);
  }
  yield call(setStateOfPath, action.payload.pathname, previousHash);
  // restore old state for new path
  previousPath = action.payload.pathname;
  previousHash = action.payload.hash;
}

function* storeStateOfPath(path: string, hash: string) {
  const focusHistory: FocusState | undefined = yield select(
    getCurrentFocusInfo,
    path,
  );
  const entity: FocusEntity = focusHistory
    ? focusHistory.entity
    : identifyEntityFromPath(path, hash);

  const selectors = FocusElementsConfig[entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  yield put(setFocusHistory(path, { entity, state }));
}

function* setStateOfPath(path: string, hash: string) {
  const focusHistory: FocusState = yield select(getCurrentFocusInfo, path);

  const entity: FocusEntity = focusHistory
    ? focusHistory.entity
    : identifyEntityFromPath(path, hash);

  const selectors = FocusElementsConfig[entity];

  if (focusHistory) {
    for (const selectorInfo of selectors) {
      yield put(selectorInfo.setter(focusHistory.state[selectorInfo.name]));
    }
  } else {
    for (const selectorInfo of selectors) {
      if ("defaultValue" in selectorInfo)
        yield put(selectorInfo.setter(selectorInfo.defaultValue));
    }
  }
}

export default function* rootSaga() {
  yield all([takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange)]);
}
