import { all, call, fork, put, select, takeEvery } from "redux-saga/effects";
import { setFocusHistory } from "actions/focusHistoryActions";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { FocusElementsConfig } from "navigation/FocusElements";
import {
  FocusEntity,
  FocusEntityInfo,
  identifyEntityFromPath,
  isSameBranch,
  shouldStoreURLforFocus,
} from "navigation/FocusEntity";
import { getAction, getPlugin } from "selectors/entitiesSelector";
import { Action } from "entities/Action";
import { Plugin } from "api/PluginApi";
import log from "loglevel";
import { Location } from "history";
import history, {
  AppsmithLocationState,
  NavigationMethod,
} from "utils/history";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { BackgroundTheme, changeAppBackground } from "sagas/ThemeSaga";
import { updateRecentEntitySaga } from "sagas/GlobalSearchSagas";

let previousPath: string;
let previousHash: string | undefined;

function* appBackgroundHandler() {
  const currentTheme: BackgroundTheme = yield select(getCurrentThemeDetails);
  changeAppBackground(currentTheme);
}

function* handleRouteChange(
  action: ReduxAction<{ location: Location<AppsmithLocationState> }>,
) {
  const { hash, pathname, state } = action.payload.location;
  try {
    yield call(logNavigationAnalytics, action.payload);
    yield call(contextSwitchingSaga, pathname, state, hash);
    yield call(appBackgroundHandler);
    const entityInfo = identifyEntityFromPath(pathname, hash);
    yield fork(updateRecentEntitySaga, entityInfo);
  } catch (e) {
    log.error("Error in focus change", e);
  } finally {
    previousPath = pathname;
    previousHash = hash;
  }
}

function* logNavigationAnalytics(payload: {
  location: Location<AppsmithLocationState>;
}) {
  const {
    location: { hash, pathname, state },
  } = payload;
  const recentEntityIds: Array<string> = yield select(getRecentEntityIds);
  const currentEntity = identifyEntityFromPath(pathname, hash);
  const previousEntity = identifyEntityFromPath(previousPath, previousHash);
  const isRecent = recentEntityIds.some(
    (entityId) => entityId === currentEntity.id,
  );
  AnalyticsUtil.logEvent("ROUTE_CHANGE", {
    toPath: pathname + hash,
    fromPath: previousPath + previousHash || undefined,
    navigationMethod: state?.invokedBy,
    isRecent,
    recentLength: recentEntityIds.length,
    toType: currentEntity.entity,
    fromType: previousEntity.entity,
  });
}

function* handlePageChange(
  action: ReduxAction<{
    pageId: string;
    currPath: string;
    currParamString: string;
    fromPath: string;
    fromParamString: string;
  }>,
) {
  const {
    currParamString,
    currPath,
    fromParamString,
    fromPath,
    pageId,
  } = action.payload;
  try {
    const fromPageId = identifyEntityFromPath(fromPath)?.pageId;
    if (fromPageId && fromPageId !== pageId) {
      yield call(storeStateOfPage, fromPageId, fromPath, fromParamString);

      yield call(setStateOfPage, pageId, currPath, currParamString);
    }
  } catch (e) {
    log.error("Error on page change", e);
  }
}

function* contextSwitchingSaga(
  pathname: string,
  state: AppsmithLocationState,
  hash?: string,
) {
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath, previousHash);
    // while switching from selected widget state to API, Query or Datasources directly, store Canvas state as well
    if (shouldStoreStateForCanvas(previousPath, pathname, previousHash, hash)) {
      yield call(storeStateOfPath, previousPath);
    }
  }
  // Check if it should restore the stored state of the path
  if (shouldSetState(previousPath, pathname, previousHash, hash, state)) {
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

function* storeStateOfPage(
  pageId: string,
  fromPath: string,
  fromParam: string | undefined,
) {
  const entity = FocusEntity.PAGE;

  const selectors = FocusElementsConfig[entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  if (shouldStoreURLforFocus(fromPath)) {
    if (fromPath) {
      state._routingURL = fromPath;
    }

    if (fromParam !== undefined) {
      state._paramString = fromParam;
    }
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
      isSameBranch(focusHistory.state._paramString, paramString)
    ) {
      history.push(
        `${focusHistory.state._routingURL}${focusHistory.state._paramString ||
          ""}`,
      );
    }
  } else {
    for (const selectorInfo of selectors) {
      if ("defaultValue" in selectorInfo)
        yield put(selectorInfo.setter(selectorInfo.defaultValue));
    }
  }
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
 * @param state
 * @returns
 */
function shouldSetState(
  prevPath: string,
  currPath: string,
  prevHash?: string,
  currHash?: string,
  state?: AppsmithLocationState,
) {
  if (
    state &&
    state.invokedBy &&
    state.invokedBy === NavigationMethod.CommandClick
  ) {
    // If it is a command click navigation, we will set the state
    return true;
  }
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
}
