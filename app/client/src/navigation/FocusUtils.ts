import type { FocusEntityInfo } from "./FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "./FocusEntity";
import {
  datasourcesEditorURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";

export const getEntityParentUrl = (
  entityInfo: FocusEntityInfo,
  parentEntity: FocusEntity,
): string => {
  if (parentEntity === FocusEntity.WIDGET_LIST) {
    const canvasUrl = widgetListURL({
      pageId: entityInfo.pageId,
    });
    return canvasUrl.split("?")[0];
  }
  if (parentEntity === FocusEntity.DATASOURCE_LIST) {
    return datasourcesEditorURL({ pageId: entityInfo.pageId });
  }
  if (parentEntity === FocusEntity.JS_OBJECT_LIST) {
    return jsCollectionListURL({ pageId: entityInfo.pageId });
  }
  if (parentEntity === FocusEntity.QUERY_LIST) {
    return queryListURL({ pageId: entityInfo.pageId });
  }
  return "";
};
export const isPageChange = (prevPath: string, currentPath: string) => {
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currentPath);
  if (prevFocusEntityInfo.pageId === "" || currFocusEntityInfo.pageId === "") {
    return false;
  }
  return prevFocusEntityInfo.pageId !== currFocusEntityInfo.pageId;
};

/**
 * Method to indicate if the URL is of type API, Query etc.,
 * and not anything else
 * @param path
 * @returns
 */
export function shouldStorePageURLForFocus(path: string) {
  const entityTypesToStore = [
    FocusEntity.QUERY,
    FocusEntity.API,
    FocusEntity.JS_OBJECT,
  ];

  const entity = identifyEntityFromPath(path)?.entity;

  return entityTypesToStore.indexOf(entity) >= 0;
}
