import type { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import type {
  CallEffectDescriptor,
  PutEffectDescriptor,
  SimpleEffect,
} from "redux-saga/effects";
import { call, put, select, take } from "redux-saga/effects";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  FocusEntity,
  FocusStoreHierarchy,
  identifyEntityFromPath,
  shouldStoreURLForFocus,
} from "navigation/FocusEntity";
import type { Config } from "navigation/FocusElements";
import { ConfigType, FocusElementsConfig } from "navigation/FocusElements";
import { setFocusHistory } from "actions/focusHistoryActions";
import { builderURL, datasourcesEditorURL } from "@appsmith/RouteBuilder";
import type { AppsmithLocationState } from "utils/history";
import history, { NavigationMethod } from "utils/history";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import { getAction, getPlugin } from "@appsmith/selectors/entitiesSelector";
import type { Plugin } from "api/PluginApi";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { has } from "lodash";

/**
 * Context switching works by restoring the states of ui elements to as they were
 * the last time the user was on a particular URL.
 *
 * To do this, there are two simple steps
 *  1. When leaving an url, store the ui or url states
 *  2. When entering an url, restore stored ui or url states, or defaults
 *
 * @param currentPath
 * @param previousPath
 * @param state
 */
export function* contextSwitchingSaga(
  currentPath: string,
  previousPath: string,
  state: AppsmithLocationState,
) {
  if (previousPath) {
    /* STORE THE UI STATE OF PREVIOUS URL */
    // First get all the entities
    const storePaths: Array<{
      key: string;
      entityInfo: FocusEntityInfo;
    }> = yield call(getEntitiesForStore, previousPath, currentPath);
    for (const storePath of storePaths) {
      yield call(
        storeStateOfPath,
        storePath.key,
        storePath.entityInfo,
        previousPath,
      );
    }
  }
  /* RESTORE THE UI STATE OF THE NEW URL */
  yield call(waitForPathLoad, currentPath, previousPath);
  const setPaths: Array<{
    key: string;
    entityInfo: FocusEntityInfo;
  }> = yield call(getEntitiesForSet, previousPath, currentPath, state);
  for (const setPath of setPaths) {
    yield call(setStateOfPath, setPath.key, setPath.entityInfo);
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

type StoreStateOfPathType = Generator<
  | SimpleEffect<"CALL", CallEffectDescriptor<unknown>>
  | SimpleEffect<
      "PUT",
      PutEffectDescriptor<{
        payload: { focusState: FocusState; key: string };
        type: string;
      }>
    >,
  void,
  FocusState | undefined
>;

function* storeStateOfPath(
  key: string,
  entityInfo: FocusEntityInfo,
  fromPath: string,
): StoreStateOfPathType {
  const selectors = FocusElementsConfig[entityInfo.entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    state[selectorInfo.name] = yield call(getState, selectorInfo, fromPath);
  }
  if (entityInfo.entity === FocusEntity.PAGE) {
    if (shouldStoreURLForFocus(fromPath)) {
      if (fromPath) {
        state._routingURL = fromPath;
      }
    }
  }
  yield put(
    setFocusHistory(key, {
      entityInfo,
      state,
    }),
  );
}

function* setStateOfPath(key: string, entityInfo: FocusEntityInfo) {
  const focusHistory: FocusState = yield select(getCurrentFocusInfo, key);

  const selectors = FocusElementsConfig[entityInfo.entity];

  if (focusHistory) {
    for (const selectorInfo of selectors) {
      yield call(setState, selectorInfo, focusHistory.state[selectorInfo.name]);
    }
    if (entityInfo.entity === FocusEntity.PAGE) {
      if (focusHistory.state._routingURL) {
        const params = history.location.search;
        history.push(`${focusHistory.state._routingURL}${params ?? ""}`);
      }
    }
  } else {
    const subType: string | undefined = yield call(
      getEntitySubType,
      entityInfo,
    );
    for (const selectorInfo of selectors) {
      const { defaultValue, subTypes } = selectorInfo;
      if (subType && subTypes && subType in subTypes) {
        yield call(setState, selectorInfo, subTypes[subType].defaultValue);
      } else if (defaultValue !== undefined) {
        yield call(setState, selectorInfo, defaultValue);
      }
    }
  }
}

function* getEntitySubType(entityInfo: FocusEntityInfo) {
  if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
    const action: Action | undefined = yield select(getAction, entityInfo.id);
    if (action) {
      const plugin: Plugin = yield select(getPlugin, action.pluginId);
      return plugin.packageName;
    }
  }
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
    [NavigationMethod.CommandClick, NavigationMethod.Omnibar].includes(
      state.invokedBy,
    )
  ) {
    // If it is a direct navigation, we will set the state
    return true;
  }
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currPath);

  // While switching from selected widget state to canvas,
  // it should not be restored stored state for canvas
  return !(
    prevFocusEntityInfo.entity === FocusEntity.PROPERTY_PANE &&
    currFocusEntityInfo.entity === FocusEntity.CANVAS &&
    prevFocusEntityInfo.pageId === currFocusEntityInfo.pageId
  );
}

const getEntityParentUrl = (
  entityInfo: FocusEntityInfo,
  parentEntity: FocusEntity,
): string => {
  if (parentEntity === FocusEntity.CANVAS) {
    const canvasUrl = builderURL({ pageId: entityInfo.pageId ?? "" });
    return canvasUrl.split("?")[0];
  }
  if (parentEntity === FocusEntity.DATASOURCE_LIST) {
    return datasourcesEditorURL({ pageId: entityInfo.pageId });
  }
  return "";
};

const isPageChange = (prevPath: string, currentPath: string) => {
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currentPath);
  if (prevFocusEntityInfo.pageId === "" || currFocusEntityInfo.pageId === "") {
    return false;
  }
  return prevFocusEntityInfo.pageId !== currFocusEntityInfo.pageId;
};

function* getEntitiesForStore(previousPath: string, currentPath: string) {
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const entities: Array<{ entityInfo: FocusEntityInfo; key: string }> = [];
  const prevFocusEntityInfo = identifyEntityFromPath(previousPath);
  if (isPageChange(previousPath, currentPath)) {
    if (prevFocusEntityInfo.pageId) {
      entities.push({
        key: `${prevFocusEntityInfo.pageId}#${branch}`,
        entityInfo: {
          entity: FocusEntity.PAGE,
          id: prevFocusEntityInfo.pageId,
        },
      });
    }
  }

  if (prevFocusEntityInfo.entity in FocusStoreHierarchy) {
    const parentEntity = FocusStoreHierarchy[prevFocusEntityInfo.entity];
    if (parentEntity) {
      const parentPath = getEntityParentUrl(prevFocusEntityInfo, parentEntity);
      entities.push({
        entityInfo: {
          entity: parentEntity,
          id: "",
          pageId: prevFocusEntityInfo.pageId,
        },
        key: `${parentPath}#${branch}`,
      });
    }
  }

  entities.push({
    entityInfo: prevFocusEntityInfo,
    key: `${previousPath}#${branch}`,
  });

  return entities.filter(
    (entity) => entity.entityInfo.entity !== FocusEntity.NONE,
  );
}

function* getEntitiesForSet(
  previousPath: string,
  currentPath: string,
  state: AppsmithLocationState,
) {
  if (!shouldSetState(previousPath, currentPath, state)) {
    return [];
  }
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const entities: Array<{ entityInfo: FocusEntityInfo; key: string }> = [];
  const currentEntityInfo = identifyEntityFromPath(currentPath);
  if (isPageChange(previousPath, currentPath)) {
    if (currentEntityInfo.pageId) {
      entities.push({
        key: `${currentEntityInfo.pageId}#${branch}`,
        entityInfo: {
          entity: FocusEntity.PAGE,
          id: currentEntityInfo.pageId,
        },
      });

      const focusHistory: FocusState = yield select(
        getCurrentFocusInfo,
        `${currentEntityInfo.pageId}#${branch}`,
      );
      if (has(focusHistory, "state._routingURL")) {
        return entities;
      }
    }
  }

  entities.push({
    entityInfo: currentEntityInfo,
    key: `${currentPath}#${branch}`,
  });
  return entities.filter(
    (entity) => entity.entityInfo.entity !== FocusEntity.NONE,
  );
}

function* getState(config: Config, previousURL: string): unknown {
  if (config.type === ConfigType.Redux) {
    return yield select(config.selector);
  } else if (config.type === ConfigType.URL) {
    return config.selector(previousURL);
  }
}

function* setState(config: Config, value: unknown): unknown {
  if (config.type === ConfigType.Redux) {
    yield put(config.setter(value));
  } else if (config.type === ConfigType.URL) {
    config.setter(value);
  }
}
