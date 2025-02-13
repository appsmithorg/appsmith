import { all, select, take } from "redux-saga/effects";
import type { FocusPath, FocusStrategy } from "sagas/FocusRetentionSaga";
import type { AppsmithLocationState } from "utils/history";
import { NavigationMethod } from "utils/history";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  FocusEntity,
  FocusStoreHierarchy,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import { EditorState } from "IDE/enums";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  datasourcesEditorURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "ee/RouteBuilder";
import AppIDEFocusElements from "../FocusElements/AppIDE";
import { selectGitApplicationCurrentBranch } from "selectors/gitModSelectors";

function shouldSetState(
  prevPath: string,
  currPath: string,
  state?: AppsmithLocationState,
) {
  if (
    state &&
    state.invokedBy &&
    NavigationMethod.AppNavigation === state.invokedBy
  ) {
    return false;
  }

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
  const isSamePage = !isPageChange(prevPath, currPath);

  // While switching from Widget Add state to a widget, we should
  // not restore any last selected widget. We are breaking this because
  // to break a user selection loop whenever trying to close a widget
  if (
    prevFocusEntityInfo.entity === FocusEntity.CANVAS &&
    currFocusEntityInfo.entity === FocusEntity.WIDGET_LIST &&
    isSamePage &&
    state?.invokedBy !== NavigationMethod.ContextSwitching
  ) {
    return false;
  }

  // While switching from selected widget state to canvas,
  // it should not be restored stored state for canvas
  return !(
    prevFocusEntityInfo.entity === FocusEntity.WIDGET &&
    (currFocusEntityInfo.entity === FocusEntity.WIDGET_LIST ||
      currFocusEntityInfo.entity === FocusEntity.CANVAS) &&
    isSamePage
  );
}

const isPageChange = (prevPath: string, currentPath: string) => {
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currentPath);

  if (
    prevFocusEntityInfo.params.basePageId === "" ||
    currFocusEntityInfo.params.basePageId === ""
  ) {
    return false;
  }

  return (
    prevFocusEntityInfo.params.basePageId !==
    currFocusEntityInfo.params.basePageId
  );
};

const getAppId = (focusInfo: FocusEntityInfo) => {
  const { appId, applicationSlug, baseApplicationId } = focusInfo.params;

  return applicationSlug || baseApplicationId || appId;
};

const isAppChange = (
  prevFocusInfo: FocusEntityInfo,
  currentFocusInfo: FocusEntityInfo,
) => {
  const prevAppId = getAppId(prevFocusInfo);
  const currentAppId = getAppId(currentFocusInfo);

  return prevAppId !== currentAppId;
};

export const createEditorFocusInfoKey = (
  appId: string,
  branch: string | null = null,
) => {
  return branch ? `EDITOR_STATE.${appId}#${branch}` : `EDITOR_STATE.${appId}`;
};

export const createEditorFocusInfo = (
  appId: string,
  branch: string | null,
) => ({
  key: createEditorFocusInfoKey(appId, branch),
  entityInfo: {
    id: `EDITOR.${appId}`,
    appState: EditorState.EDITOR,
    entity: FocusEntity.EDITOR,
    params: {},
  },
});

export const createPageFocusInfoKey = (
  basePageId: string,
  branch: string | null = null,
) => {
  return branch ? `PAGE.${basePageId}#${branch}` : `PAGE.${basePageId}`;
};

export const createPageFocusInfo = (
  basePageId: string,
  branch: string | null,
) => ({
  key: createPageFocusInfoKey(basePageId, branch),
  entityInfo: {
    id: `PAGE.${basePageId}`,
    appState: EditorState.EDITOR,
    entity: FocusEntity.PAGE,
    params: {},
  },
});

export const AppIDEFocusStrategy: FocusStrategy = {
  focusElements: AppIDEFocusElements,
  getEntitiesForSet: function* (
    previousPath: string,
    currentPath: string,
    state: AppsmithLocationState,
  ) {
    if (!shouldSetState(previousPath, currentPath, state)) {
      return [];
    }

    const branch: string | null = yield select(
      selectGitApplicationCurrentBranch,
    );
    const entities: Array<{ entityInfo: FocusEntityInfo; key: string }> = [];
    const prevEntityInfo = identifyEntityFromPath(previousPath);
    const currentEntityInfo = identifyEntityFromPath(currentPath);

    // Only set the editor state if switching between pages or app states
    if (
      currentEntityInfo.entity === FocusEntity.CANVAS &&
      (prevEntityInfo.params.basePageId !==
        currentEntityInfo.params.basePageId ||
        prevEntityInfo.appState !== currentEntityInfo.appState)
    ) {
      if (currentEntityInfo.params.basePageId) {
        entities.push(
          createPageFocusInfo(currentEntityInfo.params.basePageId, branch),
        );
      }
    }

    if (isAppChange(prevEntityInfo, currentEntityInfo)) {
      const appId = getAppId(currentEntityInfo);

      if (appId) {
        entities.push(createEditorFocusInfo(appId, branch));
      }
    }

    entities.push({
      entityInfo: currentEntityInfo,
      key: `${currentPath}#${branch}`,
    });

    return entities;
  },
  *getEntitiesForStore(path: string, currentPath: string) {
    const branch: string | null = yield select(
      selectGitApplicationCurrentBranch,
    );
    const entities: Array<FocusPath> = [];
    const currentFocusEntityInfo = identifyEntityFromPath(currentPath);
    const prevFocusEntityInfo = identifyEntityFromPath(path);

    // If the entity has a parent defined, store the state of the parent as well.
    if (prevFocusEntityInfo.entity in FocusStoreHierarchy) {
      const parentEntity = FocusStoreHierarchy[prevFocusEntityInfo.entity];

      if (parentEntity && parentEntity !== currentFocusEntityInfo.entity) {
        const parentPath = AppIDEFocusStrategy.getEntityParentUrl(
          prevFocusEntityInfo,
          parentEntity,
        );

        entities.push({
          entityInfo: {
            entity: parentEntity,
            id: "",
            appState: prevFocusEntityInfo.appState,
            params: prevFocusEntityInfo.params,
          },
          key: `${parentPath}#${branch}`,
        });
      }
    }

    // Store editor state if previous url was in editor.
    // Does not matter if still in editor or not
    if (
      prevFocusEntityInfo.appState === EditorState.EDITOR &&
      prevFocusEntityInfo.entity !== FocusEntity.NONE &&
      (prevFocusEntityInfo.entity !== currentFocusEntityInfo.entity ||
        prevFocusEntityInfo.params.basePageId !==
          currentFocusEntityInfo.params.basePageId)
    ) {
      if (prevFocusEntityInfo.params.basePageId) {
        entities.push(
          createPageFocusInfo(prevFocusEntityInfo.params.basePageId, branch),
        );
      }
    }

    if (isAppChange(prevFocusEntityInfo, currentFocusEntityInfo)) {
      const appId = getAppId(prevFocusEntityInfo);

      if (appId) {
        entities.push(createEditorFocusInfo(appId, branch));
      }
    }

    // Do not store focus of parents based on url change
    if (
      !Object.values(FocusStoreHierarchy).includes(prevFocusEntityInfo.entity)
    ) {
      entities.push({
        entityInfo: prevFocusEntityInfo,
        key: `${path}#${branch}`,
      });
    }

    return entities;
  },
  getEntityParentUrl: (
    entityInfo: FocusEntityInfo,
    parentEntity: FocusEntity,
  ): string => {
    let parentUrl: string = "";

    if (parentEntity === FocusEntity.WIDGET_LIST) {
      parentUrl = widgetListURL({
        basePageId: entityInfo.params.basePageId,
      });
    }

    if (parentEntity === FocusEntity.DATASOURCE_LIST) {
      parentUrl = datasourcesEditorURL({
        basePageId: entityInfo.params.basePageId,
      });
    }

    if (parentEntity === FocusEntity.JS_OBJECT_LIST) {
      parentUrl = jsCollectionListURL({
        basePageId: entityInfo.params.basePageId,
      });
    }

    if (parentEntity === FocusEntity.QUERY_LIST) {
      parentUrl = queryListURL({
        basePageId: entityInfo.params.basePageId,
      });
    }

    // We do not have to add any query params because this url is used as the key
    return parentUrl.split("?")[0];
  },
  *waitForPathLoad(currentPath: string, previousPath?: string) {
    if (previousPath) {
      // When page is changing, there may be some items still not loaded,
      // so wait till the page fetch is complete
      if (isPageChange(previousPath, currentPath)) {
        yield take(ReduxActionTypes.FETCH_PAGE_SUCCESS);
      }
    } else {
      // Wait for the application's actions and plugins to be fetched
      // so we know if we should focus the Headers or Body tab in the API Editor,
      // which depends on the action type.
      yield all([
        take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
        take(ReduxActionTypes.FETCH_PLUGINS_SUCCESS),
      ]);
    }
  },
};
