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
} from "@appsmith/constants/ReduxActionConstants";
import { setFocusHistory } from "actions/focusHistoryActions";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { FocusElementsConfig } from "navigation/FocusElements";
import history from "utils/history";
import {
  FocusEntity,
  FocusEntityInfo,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import { getAction, getPlugin } from "selectors/entitiesSelector";
import { Action } from "entities/Action";
import { Plugin } from "api/PluginApi";
import log from "loglevel";
import FeatureFlags from "entities/FeatureFlags";
import { selectFeatureFlags } from "selectors/usersSelectors";

let previousPath: string;
let previousHash: string | undefined;

let previousPageId: string;
let previousURL: string;
let previousParamString: string | null;

function* handleRouteChange(
  action: ReduxAction<{ pathname: string; hash?: string }>,
) {
  const { hash, pathname } = action.payload;
  try {
    const featureFlags: FeatureFlags = yield select(selectFeatureFlags);
    if (featureFlags.CONTEXT_SWITCHING) {
      yield call(contextSwitchingSaga, pathname, hash);
    }
  } catch (e) {
    log.error("Error in focus change", e);
  } finally {
    previousPath = pathname;
    previousHash = hash;
  }
}

function* handlePageChange(
  action: ReduxAction<{
    pageId: string;
    currPath: string;
    paramString: string;
  }>,
) {
  const { currPath, pageId, paramString } = action.payload;
  try {
    const featureFlags: FeatureFlags = yield select(selectFeatureFlags);
    if (featureFlags.CONTEXT_SWITCHING) {
      if (previousPageId) {
        yield call(storeStateOfPage, previousPageId);
      }

      yield call(setStateOfPage, pageId, currPath, paramString);
    }
  } catch (e) {
    log.error("Error on page change", e);
  } finally {
    previousPageId = pageId;
  }
}

function* contextSwitchingSaga(pathname: string, hash?: string) {
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath, previousHash);
    // while switching from selected widget state to API, Query or Datasources directly, store Canvas state as well
    if (shouldStoreStateForCanvas(previousPath, pathname, previousHash, hash)) {
      yield call(storeStateOfPath, previousPath);
    }
  }
  // Check if it should restore the stored state of the path
  if (shouldSetState(previousPath, pathname, previousHash, hash)) {
    // restore old state for new path
    yield call(setStateOfPath, pathname, hash);
  }
}

function* storeStateOfPath(path: string, hash?: string) {
  const focusHistory: FocusState | undefined = yield select(
    getCurrentFocusInfo,
    hash ? `${path}${hash}` : path,
  );
  const entityInfo: FocusEntityInfo = focusHistory
    ? focusHistory.entityInfo
    : identifyEntityFromPath(path, hash);

  const selectors = FocusElementsConfig[entityInfo.entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  yield put(
    setFocusHistory(hash ? `${path}${hash}` : path, {
      entityInfo,
      state,
    }),
  );
}

function* setStateOfPath(path: string, hash?: string) {
  const focusHistory: FocusState = yield select(
    getCurrentFocusInfo,
    hash ? `${path}${hash}` : path,
  );

  const entityInfo: FocusEntityInfo = focusHistory
    ? focusHistory.entityInfo
    : identifyEntityFromPath(path, hash);

  const selectors = FocusElementsConfig[entityInfo.entity];

  if (focusHistory) {
    for (const selectorInfo of selectors) {
      yield put(selectorInfo.setter(focusHistory.state[selectorInfo.name]));
    }
  } else {
    const subType: string | undefined = yield call(
      getEntitySubType,
      entityInfo,
    );
    for (const selectorInfo of selectors) {
      const { defaultValue, subTypes } = selectorInfo;
      if (subType && subTypes && subType in subTypes) {
        yield put(selectorInfo.setter(subTypes[subType].defaultValue));
      } else if (defaultValue !== undefined) {
        yield put(selectorInfo.setter(defaultValue));
      }
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
  if (previousURL && previousURL.includes(pageId)) {
    state._routingURL = previousURL;
  } else {
    state._routingURL = undefined;
  }

  if (previousParamString !== undefined) {
    state._paramString = previousParamString;
  }

  const entityInfo = { entity, id: pageId };
  yield put(setFocusHistory(pageId, { entityInfo, state }));
}

function* setStateOfPage(
  pageId: string,
  currPath: string,
  paramString: string,
) {
  const focusHistory: FocusState = yield select(getCurrentFocusInfo, pageId);

  const entity = FocusEntity.PAGE;

  const selectors = FocusElementsConfig[entity];

  if (focusHistory) {
    for (const selectorInfo of selectors) {
      yield put(selectorInfo.setter(focusHistory.state[selectorInfo.name]));
    }
    if (
      focusHistory.state._routingURL &&
      focusHistory.state._routingURL !== currPath &&
      focusHistory.state._paramString === paramString
    ) {
      history.push(`${focusHistory.state._routingURL}${paramString}`);
    }
  } else {
    for (const selectorInfo of selectors) {
      if ("defaultValue" in selectorInfo)
        yield put(selectorInfo.setter(selectorInfo.defaultValue));
    }
  }
}

function* storeURLonPageChange(
  action: ReduxAction<{ url: string; paramString: string }>,
) {
  const { paramString, url } = action.payload;
  previousParamString = paramString;
  previousURL = url;
}

function* getEntitySubType(entityInfo: FocusEntityInfo) {
  if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
    const action: Action = yield select(getAction, entityInfo.id);
    const plugin: Plugin = yield select(getPlugin, action.pluginId);
    return plugin.packageName;
  }
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
  const prevFocusEntity = identifyEntityFromPath(prevPath, prevHash).entity;
  const currFocusEntity = identifyEntityFromPath(currPath, currHash).entity;

  // While switching from selected widget state to canvas,
  // it should not be restored stored state for canvas
  return !(
    prevFocusEntity === FocusEntity.PROPERTY_PANE &&
    currFocusEntity === FocusEntity.CANVAS &&
    prevPath === currPath
  );
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
  const prevFocusEntity = identifyEntityFromPath(prevPath, prevHash).entity;
  const currFocusEntity = identifyEntityFromPath(currPath, currHash).entity;

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
