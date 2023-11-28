import type { FocusEntityInfo } from "./FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "./FocusEntity";
import {
  builderURL,
  datasourcesEditorURL,
  jsCollectionListURL,
  queryListURL,
} from "@appsmith/RouteBuilder";

export const getEntityParentUrl = (
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

export const isAppStateChange = (prevPath: string, currentPath: string) => {
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currentPath);
  return prevFocusEntityInfo.appState !== currFocusEntityInfo.appState;
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
