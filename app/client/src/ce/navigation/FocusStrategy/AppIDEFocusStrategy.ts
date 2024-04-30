import { select, take } from "redux-saga/effects";
import type { FocusPath, FocusStrategy } from "sagas/FocusRetentionSaga";
import type { AppsmithLocationState } from "utils/history";
import { NavigationMethod } from "utils/history";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  FocusEntity,
  FocusStoreHierarchy,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  datasourcesEditorURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import AppIDEFocusElements from "../FocusElements/AppIDE";

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
    prevFocusEntityInfo.entity === FocusEntity.PROPERTY_PANE &&
    (currFocusEntityInfo.entity === FocusEntity.WIDGET_LIST ||
      currFocusEntityInfo.entity === FocusEntity.CANVAS) &&
    isSamePage
  );
}

const isPageChange = (prevPath: string, currentPath: string) => {
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currentPath);
  if (
    prevFocusEntityInfo.params.pageId === "" ||
    currFocusEntityInfo.params.pageId === ""
  ) {
    return false;
  }
  return (
    prevFocusEntityInfo.params.pageId !== currFocusEntityInfo.params.pageId
  );
};

export const createEditorFocusInfoKey = (pageId: string, branch?: string) =>
  `EDITOR_STATE.${pageId}#${branch}`;
export const createEditorFocusInfo = (pageId: string, branch?: string) => ({
  key: createEditorFocusInfoKey(pageId, branch),
  entityInfo: {
    id: `EDITOR.${pageId}`,
    appState: EditorState.EDITOR,
    entity: FocusEntity.EDITOR,
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
    const branch: string | undefined = yield select(getCurrentGitBranch);
    const entities: Array<{ entityInfo: FocusEntityInfo; key: string }> = [];
    const prevEntityInfo = identifyEntityFromPath(previousPath);
    const currentEntityInfo = identifyEntityFromPath(currentPath);

    // Only set the editor state if switching between pages or app states
    if (
      currentEntityInfo.entity === FocusEntity.CANVAS &&
      (prevEntityInfo.params.pageId !== currentEntityInfo.params.pageId ||
        prevEntityInfo.appState !== currentEntityInfo.appState)
    ) {
      if (currentEntityInfo.params.pageId) {
        entities.push(
          createEditorFocusInfo(currentEntityInfo.params.pageId, branch),
        );
      }
    }

    entities.push({
      entityInfo: currentEntityInfo,
      key: `${currentPath}#${branch}`,
    });
    return entities;
  },
  *getEntitiesForStore(path: string, currentPath: string) {
    const branch: string | undefined = yield select(getCurrentGitBranch);
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
        prevFocusEntityInfo.params.pageId !==
          currentFocusEntityInfo.params.pageId)
    ) {
      entities.push({
        entityInfo: {
          entity: FocusEntity.EDITOR,
          id: `EDITOR.${prevFocusEntityInfo.params.pageId}`,
          appState: EditorState.EDITOR,
          params: prevFocusEntityInfo.params,
        },
        key: `EDITOR_STATE.${prevFocusEntityInfo.params.pageId}#${branch}`,
      });
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
        pageId: entityInfo.params.pageId,
      });
    }
    if (parentEntity === FocusEntity.DATASOURCE_LIST) {
      parentUrl = datasourcesEditorURL({
        pageId: entityInfo.params.pageId,
      });
    }
    if (parentEntity === FocusEntity.JS_OBJECT_LIST) {
      parentUrl = jsCollectionListURL({
        pageId: entityInfo.params.pageId,
      });
    }
    if (parentEntity === FocusEntity.QUERY_LIST) {
      parentUrl = queryListURL({
        pageId: entityInfo.params.pageId,
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
    }
  },
};
