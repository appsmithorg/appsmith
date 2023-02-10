import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import {
  call,
  CallEffectDescriptor,
  put,
  PutEffectDescriptor,
  select,
  SelectEffectDescriptor,
  SimpleEffect,
  take,
} from "redux-saga/effects";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import {
  FocusEntity,
  FocusEntityInfo,
  FocusStoreHierarchy,
  identifyEntityFromPath,
  isSameBranch,
  shouldStoreURLForFocus,
} from "navigation/FocusEntity";
import { FocusElementsConfig } from "navigation/FocusElements";
import { setFocusHistory } from "actions/focusHistoryActions";
import { builderURL } from "RouteBuilder";
import history, {
  AppsmithLocationState,
  NavigationMethod,
} from "utils/history";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import log from "loglevel";
import { Action } from "entities/Action";
import { getAction, getPlugin } from "selectors/entitiesSelector";
import { Plugin } from "api/PluginApi";

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

export function* contextSwitchingSaga(
  currentPath: string,
  previousPath: string,
  state: AppsmithLocationState,
) {
  if (previousPath) {
    // store current state
    const storePaths = getEntitiesForStore(previousPath, currentPath);
    for (const storePath of storePaths) {
      yield call(storeStateOfPath, storePath.key, storePath.entityInfo);
    }
  }
  // Check if it should restore the stored state of the path
  if (shouldSetState(previousPath, currentPath, state)) {
    // restore old state for new path
    yield call(waitForPathLoad, currentPath, previousPath);
    yield call(setStateOfPath, currentPath);
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
  | SimpleEffect<"SELECT", SelectEffectDescriptor>
  | SimpleEffect<"CALL", CallEffectDescriptor<void>>
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
): StoreStateOfPathType {
  const selectors = FocusElementsConfig[entityInfo.entity];
  const state: Record<string, any> = {};
  for (const selectorInfo of selectors) {
    state[selectorInfo.name] = yield select(selectorInfo.selector);
  }
  yield put(
    setFocusHistory(key, {
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
  return "";
};

const isPageChange = (prevPath: string, currentPath: string) => {
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currentPath);
  return prevFocusEntityInfo.pageId !== currFocusEntityInfo.pageId;
};

const getEntitiesForStore = (
  previousPath: string,
  currentPath: string,
): Array<{ entityInfo: FocusEntityInfo; key: string }> => {
  const entities: Array<{ entityInfo: FocusEntityInfo; key: string }> = [];
  const prevFocusEntityInfo = identifyEntityFromPath(previousPath);
  if (isPageChange(previousPath, currentPath)) {
    if (prevFocusEntityInfo.pageId) {
      entities.push({
        key: prevFocusEntityInfo.pageId,
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
        key: parentPath,
      });
    }
  }

  entities.push({
    entityInfo: prevFocusEntityInfo,
    key: previousPath,
  });

  return entities;
};
