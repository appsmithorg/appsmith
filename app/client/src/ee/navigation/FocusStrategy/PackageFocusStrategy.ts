import type { FocusStrategy } from "sagas/FocusRetentionSaga";
import PackageFocusElements from "../FocusElements/PackageIDE";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  FocusEntity,
  FocusStoreHierarchy,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import {
  datasourcesEditorURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import { EditorState } from "@appsmith/entities/IDE/constants";

export const PackageFocusStrategy: FocusStrategy = {
  focusElements: PackageFocusElements,
  *getEntitiesForSet(previousPath: string, currentPath: string) {
    const entities = [];
    const prevEntityInfo = identifyEntityFromPath(previousPath);
    const currentEntityInfo = identifyEntityFromPath(currentPath);
    if (
      currentEntityInfo.entity === FocusEntity.CANVAS &&
      (prevEntityInfo.params.moduleId !== currentEntityInfo.params.moduleId ||
        prevEntityInfo.appState !== currentEntityInfo.appState)
    ) {
      entities.push({
        key: `EDITOR_STATE.${currentEntityInfo.params.moduleId}`,
        entityInfo: {
          id: `EDITOR.${currentEntityInfo.params.moduleId}`,
          appState: EditorState.EDITOR,
          entity: FocusEntity.EDITOR,
          params: {},
        },
      });
    }
    entities.push({
      entityInfo: currentEntityInfo,
      key: currentPath,
    });
    return entities;
  },
  *getEntitiesForStore(previousPath: string) {
    const entities = [];
    const prevFocusEntityInfo = identifyEntityFromPath(previousPath);
    if (prevFocusEntityInfo.entity in FocusStoreHierarchy) {
      const parentEntity = FocusStoreHierarchy[prevFocusEntityInfo.entity];
      if (parentEntity) {
        const parentPath = PackageFocusStrategy.getEntityParentUrl(
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
          key: parentPath,
        });
      }
    }
    if (
      !Object.values(FocusStoreHierarchy).includes(prevFocusEntityInfo.entity)
    ) {
      entities.push({
        entityInfo: prevFocusEntityInfo,
        key: previousPath,
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
        moduleId: entityInfo.params.moduleId,
      });
    }
    if (parentEntity === FocusEntity.DATASOURCE_LIST) {
      parentUrl = datasourcesEditorURL({
        moduleId: entityInfo.params.moduleId,
      });
    }
    if (parentEntity === FocusEntity.JS_OBJECT_LIST) {
      parentUrl = jsCollectionListURL({
        moduleId: entityInfo.params.moduleId,
      });
    }
    if (parentEntity === FocusEntity.QUERY_LIST) {
      parentUrl = queryListURL({
        moduleId: entityInfo.params.moduleId,
      });
    }
    // We do not have to add any query params because this url is used as the key
    return parentUrl.split("?")[0];
  },
  *waitForPathLoad() {},
};
