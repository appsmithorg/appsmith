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
};
export const isPageChange = (prevPath: string, currentPath: string) => {
  const prevFocusEntityInfo = identifyEntityFromPath(prevPath);
  const currFocusEntityInfo = identifyEntityFromPath(currentPath);
  if (prevFocusEntityInfo.pageId === "" || currFocusEntityInfo.pageId === "") {
    return false;
  }
  return prevFocusEntityInfo.pageId !== currFocusEntityInfo.pageId;
};
