import { call, fork, put, select, take } from "redux-saga/effects";
import {
  RouteChangeActionPayload,
  setFocusHistory,
} from "actions/focusHistoryActions";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { FocusElementsConfig } from "navigation/FocusElements";
import {
  FocusEntity,
  FocusEntityInfo,
  identifyEntityFromPath,
  isSameBranch,
  shouldStoreURLForFocus,
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
import { isEditorPath } from "@appsmith/pages/Editor/Explorer/helpers";
import {
  setLastSelectedWidget,
  setSelectedWidgets,
} from "actions/widgetSelectionActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

let previousPath: string;

function* appBackgroundHandler() {
  const currentTheme: BackgroundTheme = yield select(getCurrentThemeDetails);
  changeAppBackground(currentTheme);
}

export function* handleRouteChange(
  action: ReduxAction<RouteChangeActionPayload>,
) {
  const { pathname, state } = action.payload.location;
  try {
    const isAnEditorPath = isEditorPath(pathname);

    // handled only on edit mode
    if (isAnEditorPath) {
      yield call(logNavigationAnalytics, action.payload);
      yield call(contextSwitchingSaga, pathname, state);
      yield call(appBackgroundHandler);
      const entityInfo = identifyEntityFromPath(pathname);
      yield fork(updateRecentEntitySaga, entityInfo);
      yield fork(setSelectedWidgetsSaga, pathname);
    }
  } catch (e) {
    log.error("Error in focus change", e);
  } finally {
    previousPath = pathname;
  }
}

function* logNavigationAnalytics(payload: {
  location: Location<AppsmithLocationState>;
}) {
  const {
    location: { pathname, state },
  } = payload;
  const recentEntityIds: Array<string> = yield select(getRecentEntityIds);
  const currentEntity = identifyEntityFromPath(pathname);
  const previousEntity = identifyEntityFromPath(previousPath);
  const isRecent = recentEntityIds.some(
    (entityId) => entityId === currentEntity.id,
  );
  AnalyticsUtil.logEvent("ROUTE_CHANGE", {
    toPath: pathname,
    fromPath: previousPath || undefined,
    navigationMethod: state?.invokedBy,
    isRecent,
    recentLength: recentEntityIds.length,
    toType: currentEntity.entity,
    fromType: previousEntity.entity,
  });
}

export function* handlePageChange(
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

function* contextSwitchingSaga(pathname: string, state: AppsmithLocationState) {
  if (previousPath) {
    // store current state
    yield call(storeStateOfPath, previousPath);
    // while switching from selected widget state to API, Query or Datasources directly, store Canvas state as well
    if (shouldStoreStateForCanvas(previousPath, pathname)) {
      yield call(storeStateOfPath, previousPath);
    }
  }
  // Check if it should restore the stored state of the path
  if (shouldSetState(previousPath, pathname, state)) {
    // restore old state for new path
    yield call(waitForPathLoad, pathname, previousPath);
    yield call(setStateOfPath, pathname);
  }
}

function* waitForPathLoad(currentPath: string, previousPath?: string) {
  if (previousPath) {
    const currentFocus = identifyEntityFromPath(currentPath);
    const prevFocus = identifyEntityFromPath(previousPath);

    if (currentFocus.pageId !== prevFocus.pageId) {
      yield take(ReduxActionTypes.FETCH_PAGE_SUCCESS);
    }
  }
}

function* storeStateOfPath(path: string, hash?: string) {
  const focusHistory: FocusState | undefined = yield select(
    getCurrentFocusInfo,
    path,
  );
  const entityInfo: FocusEntityInfo = focusHistory
    ? focusHistory.entityInfo
    : identifyEntityFromPath(path);

  const selectors = FocusElementsConfig[entityInfo.entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  yield put(
    setFocusHistory(path, {
      entityInfo,
      state,
    }),
  );
}

function* setStateOfPath(path: string) {
  const focusHistory: FocusState = yield select(getCurrentFocusInfo, path);

  const entityInfo: FocusEntityInfo = focusHistory
    ? focusHistory.entityInfo
    : identifyEntityFromPath(path);

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
  if (shouldStoreURLForFocus(fromPath)) {
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

function* setSelectedWidgetsSaga(pathname: string) {
  const entityInfo = identifyEntityFromPath(pathname);
  let widgets: string[] = [];
  let lastSelectedWidget = MAIN_CONTAINER_WIDGET_ID;
  if (entityInfo.entity === FocusEntity.PROPERTY_PANE) {
    widgets = entityInfo.id.split(",");
    if (widgets.length) {
      lastSelectedWidget = widgets[widgets.length - 1];
    }
  }
  yield put(setSelectedWidgets(widgets));
  yield put(setLastSelectedWidget(lastSelectedWidget));
}

/**
 * This method returns boolean to indicate if state should be restored to the path
 * @param prevPath
 * @param currPath
 * @param state
 * @returns
 */
function shouldSetState(
  prevPath: string,
  currPath: string,
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
  const prevFocusEntity = identifyEntityFromPath(prevPath).entity;
  const currFocusEntity = identifyEntityFromPath(currPath).entity;

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
 * @returns
 */
function shouldStoreStateForCanvas(prevPath: string, currPath: string) {
  const prevFocusEntity = identifyEntityFromPath(prevPath).entity;
  const currFocusEntity = identifyEntityFromPath(currPath).entity;

  // while moving from selected widget state directly to some other state,
  // it should also store selected widgets as well
  return (
    prevFocusEntity === FocusEntity.PROPERTY_PANE &&
    currFocusEntity !== FocusEntity.PROPERTY_PANE &&
    (currFocusEntity !== FocusEntity.CANVAS || prevPath !== currPath)
  );
}
