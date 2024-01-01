import { select, take } from "redux-saga/effects";
import type { FocusStrategy } from "sagas/ContextSwitchingSaga";
import type { AppsmithLocationState } from "utils/history";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  FocusEntity,
  FocusStoreHierarchy,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";
import { NavigationMethod } from "utils/history";
import {
  datasourcesEditorURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "../../RouteBuilder";

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
  const isSamePage = !isPageChange(prevPath, currPath);

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
  if (prevFocusEntityInfo.pageId === "" || currFocusEntityInfo.pageId === "") {
    return false;
  }
  return prevFocusEntityInfo.pageId !== currFocusEntityInfo.pageId;
};

export const AppIDEFocusStrategy: FocusStrategy = {
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
    if (
      currentEntityInfo.entity === FocusEntity.CANVAS &&
      (prevEntityInfo.pageId !== currentEntityInfo.pageId ||
        prevEntityInfo.appState !== currentEntityInfo.appState)
    ) {
      entities.push({
        key: `EDITOR_STATE.${currentEntityInfo.pageId}#${branch}`,
        entityInfo: {
          id: `EDITOR.${currentEntityInfo.pageId}`,
          appState: EditorState.EDITOR,
          entity: FocusEntity.EDITOR,
        },
      });
    }

    entities.push({
      entityInfo: currentEntityInfo,
      key: `${currentPath}#${branch}`,
    });
    return entities.filter(
      (entity) => entity.entityInfo.entity !== FocusEntity.NONE,
    );
  },
  *getEntitiesForStore(path: string) {
    const branch: string | undefined = yield select(getCurrentGitBranch);
    const entities: Array<{ entityInfo: FocusEntityInfo; key: string }> = [];
    const prevFocusEntityInfo = identifyEntityFromPath(path);

    if (prevFocusEntityInfo.entity in FocusStoreHierarchy) {
      const parentEntity = FocusStoreHierarchy[prevFocusEntityInfo.entity];
      if (parentEntity) {
        const parentPath = AppIDEFocusStrategy.getEntityParentUrl(
          prevFocusEntityInfo,
          parentEntity,
        );
        entities.push({
          entityInfo: {
            entity: parentEntity,
            id: "",
            pageId: prevFocusEntityInfo.pageId,
            appState: prevFocusEntityInfo.appState,
          },
          key: `${parentPath}#${branch}`,
        });
      }
    }

    if (prevFocusEntityInfo.appState === EditorState.EDITOR) {
      entities.push({
        entityInfo: {
          entity: FocusEntity.EDITOR,
          id: `EDITOR.${prevFocusEntityInfo.pageId}`,
          pageId: prevFocusEntityInfo.pageId,
          appState: EditorState.EDITOR,
        },
        key: `EDITOR_STATE.${prevFocusEntityInfo.pageId}#${branch}`,
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

    return entities.filter(
      (entity) => entity.entityInfo.entity !== FocusEntity.NONE,
    );
  },
  getEntityParentUrl: (
    entityInfo: FocusEntityInfo,
    parentEntity: FocusEntity,
  ): string => {
    let parentUrl: string = "";
    if (parentEntity === FocusEntity.WIDGET_LIST) {
      parentUrl = widgetListURL({
        pageId: entityInfo.pageId,
      });
    }
    if (parentEntity === FocusEntity.DATASOURCE_LIST) {
      parentUrl = datasourcesEditorURL({
        pageId: entityInfo.pageId,
      });
    }
    if (parentEntity === FocusEntity.JS_OBJECT_LIST) {
      parentUrl = jsCollectionListURL({
        pageId: entityInfo.pageId,
      });
    }
    if (parentEntity === FocusEntity.QUERY_LIST) {
      parentUrl = queryListURL({
        pageId: entityInfo.pageId,
      });
    }
    return parentUrl.split("?")[0];
  },
  *waitForPathLoad(currentPath: string, previousPath?: string) {
    if (previousPath) {
      if (isPageChange(previousPath, currentPath)) {
        yield take(ReduxActionTypes.FETCH_PAGE_SUCCESS);
      }
    }
  },
};
