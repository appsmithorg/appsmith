import type { FocusStrategy } from "sagas/FocusRetentionSaga";
import WorkflowFocusElements from "../FocusElements/WorkflowIDE";
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

export const WorkflowFocusStrategy: FocusStrategy = {
  focusElements: WorkflowFocusElements,
  *getEntitiesForSet(previousPath: string, currentPath: string) {
    const entities = [];
    const currentEntityInfo = identifyEntityFromPath(currentPath);
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
        const parentPath = WorkflowFocusStrategy.getEntityParentUrl(
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
        workflowId: entityInfo.params.workflowId,
      });
    }
    if (parentEntity === FocusEntity.DATASOURCE_LIST) {
      parentUrl = datasourcesEditorURL({
        workflowId: entityInfo.params.workflowId,
      });
    }
    if (parentEntity === FocusEntity.JS_OBJECT_LIST) {
      parentUrl = jsCollectionListURL({
        workflowId: entityInfo.params.workflowId,
      });
    }
    if (parentEntity === FocusEntity.QUERY_LIST) {
      parentUrl = queryListURL({
        workflowId: entityInfo.params.workflowId,
      });
    }
    // We do not have to add any query params because this url is used as the key
    return parentUrl.split("?")[0];
  },
  *waitForPathLoad() {},
};
