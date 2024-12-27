import type { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import type { StrictEffect } from "redux-saga/effects";
import { call, put, select } from "redux-saga/effects";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  FocusEntity,
  FocusStoreHierarchy,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import type { FocusElementConfig } from "navigation/FocusElements";
import { FocusElementConfigType } from "navigation/FocusElements";
import {
  removeFocusHistory,
  storeFocusHistory,
} from "actions/focusHistoryActions";
import type { AppsmithLocationState } from "utils/history";
import type { Action } from "entities/Action";
import { getAction, getPlugin } from "ee/selectors/entitiesSelector";
import type { Plugin } from "api/PluginApi";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { getIDEFocusStrategy } from "ee/navigation/FocusStrategy";
import { IDE_TYPE } from "ee/entities/IDE/constants";
import { selectGitApplicationCurrentBranch } from "selectors/gitModSelectors";

export interface FocusPath {
  key: string;
  entityInfo: FocusEntityInfo;
}

export type FocusElementsConfigList = {
  [key in FocusEntity]?: FocusElementConfig[];
};

export interface FocusStrategy {
  focusElements: FocusElementsConfigList;
  /** based on the route change, what states need to be set in the upcoming route **/
  getEntitiesForSet: (
    previousPath: string,
    currentPath: string,
    state: AppsmithLocationState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Generator<any, Array<FocusPath>, any>;
  /** based on the route change, what states need to be stored for the previous route **/
  getEntitiesForStore: (
    path: string,
    currentPath: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Generator<any, Array<FocusPath>, any>;
  /** For entities with hierarchy, return the parent entity path for storing its state  **/
  getEntityParentUrl: (
    entityInfo: FocusEntityInfo,
    parentEntity: FocusEntity,
  ) => string;
  /** Define a wait (saga) before we start setting states  **/
  waitForPathLoad: (
    currentPath: string,
    previousPath: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Generator<any, void, any>;
}

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
class FocusRetention {
  private focusStrategy: FocusStrategy;

  constructor() {
    this.focusStrategy = getIDEFocusStrategy(IDE_TYPE.None);
    this.updateFocusStrategy = this.updateFocusStrategy.bind(this);
    this.storeStateOfPath = this.storeStateOfPath.bind(this);
    this.setStateOfPath = this.setStateOfPath.bind(this);
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.handleRemoveFocusHistory = this.handleRemoveFocusHistory.bind(this);
  }

  public *onRouteChange(
    currentPath: string,
    previousPath: string,
    state: AppsmithLocationState,
  ) {
    this.updateFocusStrategy(currentPath);

    /* STORE THE UI STATE OF PREVIOUS URL */
    if (previousPath) {
      const toStore: Array<FocusPath> = yield call(
        this.focusStrategy.getEntitiesForStore,
        previousPath,
        currentPath,
      );

      for (const storePath of toStore) {
        yield call(this.storeStateOfPath, storePath, previousPath);
      }
    }

    /* RESTORE THE UI STATE OF THE NEW URL */
    yield call(this.focusStrategy.waitForPathLoad, currentPath, previousPath);
    const setPaths: Array<FocusPath> = yield call(
      this.focusStrategy.getEntitiesForSet,
      previousPath,
      currentPath,
      state,
    );

    for (const setPath of setPaths) {
      yield call(this.setStateOfPath, setPath.key, setPath.entityInfo);
    }
  }

  public *handleRemoveFocusHistory(url: string) {
    const branch: string | undefined = yield select(
      selectGitApplicationCurrentBranch,
    );
    const removeKeys: string[] = [];
    const focusEntityInfo = identifyEntityFromPath(url);

    removeKeys.push(`${url}#${branch}`);

    const parentElement = FocusStoreHierarchy[focusEntityInfo.entity];

    if (parentElement) {
      const parentPath = this.focusStrategy.getEntityParentUrl(
        focusEntityInfo,
        parentElement,
      );

      removeKeys.push(`${parentPath}#${branch}`);
    }

    for (const key of removeKeys) {
      yield put(removeFocusHistory(key));
    }
  }

  private updateFocusStrategy(currentPath: string) {
    const ideType = getIDETypeByUrl(currentPath);

    this.focusStrategy = getIDEFocusStrategy(ideType);
  }

  protected *storeStateOfPath(
    focusPath: FocusPath,
    fromPath: string,
  ): Generator<StrictEffect, void, FocusState | undefined> {
    const selectors =
      this.focusStrategy.focusElements[focusPath.entityInfo.entity];

    if (!selectors) return;

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state: Record<string, any> = {};

    for (const selectorInfo of selectors) {
      state[selectorInfo.name] = yield call(
        this.getState,
        selectorInfo,
        fromPath,
      );

      if (selectorInfo.persist) {
        this.persistState(
          focusPath.key,
          selectorInfo,
          state[selectorInfo.name],
        );
      }
    }

    yield put(
      storeFocusHistory(focusPath.key, {
        entityInfo: focusPath.entityInfo,
        state,
      }),
    );
  }

  protected *setStateOfPath(key: string, entityInfo: FocusEntityInfo) {
    const focusHistory: FocusState = yield select(getCurrentFocusInfo, key);

    const selectors = this.focusStrategy.focusElements[entityInfo.entity];

    if (!selectors) return;

    if (focusHistory) {
      for (const selectorInfo of selectors) {
        yield call(
          this.setState,
          selectorInfo,
          focusHistory.state[selectorInfo.name],
        );
      }
    } else {
      const subType: string | undefined = yield call(
        this.getEntitySubType,
        entityInfo,
      );

      for (const selectorInfo of selectors) {
        const { defaultValue, persist, subTypes } = selectorInfo;
        const persistedState = this.retrievePersistState(key, selectorInfo);

        if (persist && persistedState) {
          yield call(this.setState, selectorInfo, persistedState);
        } else if (subType && subTypes && subType in subTypes) {
          yield call(
            this.setState,
            selectorInfo,
            subTypes[subType].defaultValue,
          );
        } else if (defaultValue !== undefined) {
          if (typeof defaultValue === "function") {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const stateDefaultValue: unknown = yield select(defaultValue);

            yield call(this.setState, selectorInfo, stateDefaultValue);
          } else {
            yield call(this.setState, selectorInfo, defaultValue);
          }
        }
      }
    }
  }

  private *getEntitySubType(entityInfo: FocusEntityInfo) {
    if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
      const action: Action | undefined = yield select(getAction, entityInfo.id);

      if (action) {
        const plugin: Plugin = yield select(getPlugin, action.pluginId);

        return plugin.packageName;
      }
    }
  }

  private *getState(config: FocusElementConfig, previousURL: string): unknown {
    if (config.type === FocusElementConfigType.Redux) {
      return yield select(config.selector);
    } else if (config.type === FocusElementConfigType.URL) {
      return config.selector(previousURL);
    }
  }
  private *setState(config: FocusElementConfig, value: unknown): unknown {
    if (config.type === FocusElementConfigType.Redux) {
      yield put(config.setter(value));
    } else if (config.type === FocusElementConfigType.URL) {
      config.setter(value);
    }
  }

  persistState(key: string, config: FocusElementConfig, value: unknown) {
    localStorage.setItem(
      `FocusHistory.${key}.${config.name}`,
      JSON.stringify(value),
    );
  }

  retrievePersistState(key: string, config: FocusElementConfig) {
    const state = localStorage.getItem(`FocusHistory.${key}.${config.name}`);

    if (state) {
      return JSON.parse(state);
    }
  }
}

export default new FocusRetention();
