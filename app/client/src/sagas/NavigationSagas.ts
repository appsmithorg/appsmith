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
let previousHash: string | undefined;

function* handleRouteChange(
  action: ReduxAction<{ pathname: string; hash?: string }>,
) {
  const { hash, pathname } = action.payload;
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath, previousHash);
    // while switching from selected widget state to API, Query or Datasources directly, store Canvas state as well
    if (shouldStoreStateForCanvas(previousPath, pathname, previousHash, hash))
      yield call(storeStateOfPath, previousPath);
  }
  if (shouldSetState(previousPath, pathname, previousHash, hash))
    yield call(setStateOfPath, pathname, hash);
  // restore old state for new path
  previousPath = pathname;
  previousHash = hash;
}

function shouldSetState(
  prevPath: string,
  currPath: string,
  prevHash?: string,
  currHash?: string,
) {
  const prevFocusEntity = identifyEntityFromPath(prevPath, prevHash);
  const currFocusEntity = identifyEntityFromPath(currPath, currHash);

  if (
    prevFocusEntity === FocusEntity.PROPERTY_PANE &&
    currFocusEntity === FocusEntity.CANVAS &&
    prevPath === currPath
  ) {
    return false;
  }

  return true;
}

function shouldStoreStateForCanvas(
  prevPath: string,
  currPath: string,
  prevHash?: string,
  currHash?: string,
) {
  const prevFocusEntity = identifyEntityFromPath(prevPath, prevHash);
  const currFocusEntity = identifyEntityFromPath(currPath, currHash);

  return (
    prevFocusEntity === FocusEntity.PROPERTY_PANE &&
    currFocusEntity !== FocusEntity.PROPERTY_PANE &&
    currFocusEntity !== FocusEntity.CANVAS
  );
}

function* storeStateOfPath(path: string, hash?: string) {
  const focusHistory: FocusState | undefined = yield select(
    getCurrentFocusInfo,
    hash ? `${path}${hash}` : path,
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
  yield put(setFocusHistory(hash ? `${path}${hash}` : path, { entity, state }));
}

function* setStateOfPath(path: string, hash?: string) {
  const focusHistory: FocusState = yield select(
    getCurrentFocusInfo,
    hash ? `${path}${hash}` : path,
  );

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
