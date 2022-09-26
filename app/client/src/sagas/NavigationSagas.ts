import {
  all,
  call,
  put,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { setFocusHistory } from "actions/focusHistoryActions";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { FocusElementsConfig } from "navigation/FocusElements";
import { identifyEntityFromPath, FocusEntity } from "navigation/FocusEntity";
import history from "utils/history";

let previousPath: string;
let previousHash: string | undefined;

let previousPageId: string;
let previousURL: string;

function* handleRouteChange(
  action: ReduxAction<{ pathname: string; hash?: string }>,
) {
  const { hash, pathname } = action.payload;
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath, previousHash);
    // while switching from selected widget state to API, Query or Datasources directly, store Canvas state as well
    if (shouldStoreStateForCanvas(previousPath, pathname, previousHash, hash)) {
      yield call(storeStateOfPath, previousPath);
    }
  }
  // Check if if should restore the stored state of the path
  if (shouldSetState(previousPath, pathname, previousHash, hash)) {
    // restore old state for new path
    yield call(setStateOfPath, pathname, hash);
  }

  previousPath = pathname;
  previousHash = hash;
}

function* handlePageChange(
  action: ReduxAction<{ pageId: string; currPath: string }>,
) {
  const { currPath, pageId } = action.payload;

  if (previousPageId) {
    yield call(storeStateOfPage, previousPageId);
  }

  yield call(setStateOfPage, pageId, currPath);

  previousPageId = pageId;
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

function* storeStateOfPage(pageId: string) {
  const entity = FocusEntity.PAGE;

  const selectors = FocusElementsConfig[entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  state._routingURL = previousURL;
  yield put(setFocusHistory(pageId, { entity, state }));
}

function* setStateOfPage(pageId: string, currPath: string) {
  const focusHistory: FocusState = yield select(getCurrentFocusInfo, pageId);

  const entity = FocusEntity.PAGE;

  const selectors = FocusElementsConfig[entity];

  if (focusHistory) {
    for (const selectorInfo of selectors) {
      yield put(selectorInfo.setter(focusHistory.state[selectorInfo.name]));
    }
    if (
      focusHistory.state._routingURL &&
      focusHistory.state._routingURL !== currPath
    ) {
      history.push(focusHistory.state._routingURL);
    }
  } else {
    for (const selectorInfo of selectors) {
      if ("defaultValue" in selectorInfo)
        yield put(selectorInfo.setter(selectorInfo.defaultValue));
    }
  }
}

function* storeURLonPageChange(action: ReduxAction<string>) {
  previousURL = action.payload;
}

/**
 * This method returns boolean to indicate if state should be restored to the path
 * @param prevPath
 * @param currPath
 * @param prevHash
 * @param currHash
 * @returns
 */
function shouldSetState(
  prevPath: string,
  currPath: string,
  prevHash?: string,
  currHash?: string,
) {
  const prevFocusEntity = identifyEntityFromPath(prevPath, prevHash);
  const currFocusEntity = identifyEntityFromPath(currPath, currHash);

  // While switching from selected widget state to canvas,
  // it should not restored stored state for canvas
  if (
    prevFocusEntity === FocusEntity.PROPERTY_PANE &&
    currFocusEntity === FocusEntity.CANVAS &&
    prevPath === currPath
  ) {
    return false;
  }

  return true;
}

/**
 * This method returns boolean if it should store an additional intermediate state
 * @param prevPath
 * @param currPath
 * @param prevHash
 * @param currHash
 * @returns
 */
function shouldStoreStateForCanvas(
  prevPath: string,
  currPath: string,
  prevHash?: string,
  currHash?: string,
) {
  const prevFocusEntity = identifyEntityFromPath(prevPath, prevHash);
  const currFocusEntity = identifyEntityFromPath(currPath, currHash);

  // while moving from selected widget state directly to some other state,
  // it should also store selected widgets as well
  return (
    prevFocusEntity === FocusEntity.PROPERTY_PANE &&
    currFocusEntity !== FocusEntity.PROPERTY_PANE &&
    (currFocusEntity !== FocusEntity.CANVAS || prevPath !== currPath)
  );
}

export default function* rootSaga() {
  yield all([takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange)]);
  yield all([takeEvery(ReduxActionTypes.PAGE_CHANGED, handlePageChange)]);
  yield all([
    takeLatest(ReduxActionTypes.STORE_URL_ON_PAGE_CHANGE, storeURLonPageChange),
  ]);
}
