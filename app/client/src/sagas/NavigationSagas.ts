import { call, put, select, take } from "redux-saga/effects";
import { setFocusHistory } from "actions/focusHistoryActions";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { FocusElementsConfig } from "navigation/FocusElements";
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
import { Location } from "history";
import history from "utils/history";
import { EventChannel, eventChannel } from "redux-saga";
import {
  selectMultipleWidgetsAction,
  selectWidgetAction,
} from "actions/widgetSelectionActions";

const listenToUrlChanges = () => {
  return eventChannel((emitter) => {
    return history.listen((location: Location<unknown>, action: string) => {
      emitter({ location, action });
    });
  });
};

type LocationChangePayload = {
  location: Location<unknown>;
  action: string;
};

function* navigationListenerSaga() {
  const eventChan: EventChannel<{
    location: string;
    action: string;
  }> = yield call(listenToUrlChanges);

  while (true) {
    const payload: LocationChangePayload = yield take(eventChan);
    yield call(handleRouteChange, payload);
  }
}
let previousPath: string;
let previousHash: string | undefined;

function* handleRouteChange(payload: LocationChangePayload) {
  const { hash, pathname } = payload.location;
  try {
    yield call(selectWidgetsBasedOnUrl, payload.location);
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

function* selectWidgetsBasedOnUrl(url: Location<unknown>) {
  const { hash, pathname } = url;
  const entity = identifyEntityFromPath(pathname, hash).entity;
  if ([FocusEntity.PROPERTY_PANE, FocusEntity.CANVAS].includes(entity)) {
    if (!hash) {
      yield put(selectMultipleWidgetsAction([]));
      return;
    }
    const widgetsInURL = hash.slice(1).split(",");
    const isMulti = widgetsInURL.length > 1;
    if (isMulti) {
      yield put(selectMultipleWidgetsAction(widgetsInURL));
    } else {
      yield put(selectWidgetAction(widgetsInURL[0], false));
    }
  } else {
    yield put(selectMultipleWidgetsAction([]));
  }
}

export default function* rootSaga() {
  yield call(navigationListenerSaga);
}
