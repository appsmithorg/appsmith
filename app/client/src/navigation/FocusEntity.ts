import { matchPath } from "react-router";
import {
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  DATA_SOURCES_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import { SAAS_EDITOR_DATASOURCE_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";

export enum FocusEntity {
  API = "API",
  CANVAS = "CANVAS",
  DATASOURCE = "DATASOURCE",
  QUERY = "QUERY",
  JS_OBJECT = "JS_OBJECT",
  PROPERTY_PANE = "PROPERTY_PANE",
  NONE = "NONE",
}

export type FocusEntityInfo = {
  entity: FocusEntity;
  id: string;
};

export function identifyEntityFromPath(
  path: string,
  hash?: string,
): FocusEntityInfo {
  let appPath = path;
  if (hash) {
    appPath = path.split("#")[0];
  }
  const match = matchPath<{
    apiId?: string;
    datasourceId?: string;
    pluginPackageName?: string;
    queryId?: string;
    appId?: string;
    pageId?: string;
    collectionId?: string;
  }>(appPath, {
    path: [
      BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
      BUILDER_PATH + API_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_PATH,
      BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + DATA_SOURCES_EDITOR_ID_PATH,
      BUILDER_PATH + DATA_SOURCES_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + DATA_SOURCES_EDITOR_ID_PATH,
      BUILDER_PATH + SAAS_EDITOR_DATASOURCE_ID_PATH,
      BUILDER_CUSTOM_PATH + SAAS_EDITOR_DATASOURCE_ID_PATH,
      BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
      BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
      BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
      BUILDER_PATH_DEPRECATED + JS_COLLECTION_ID_PATH,
      BUILDER_PATH + JS_COLLECTION_ID_PATH,
      BUILDER_CUSTOM_PATH + JS_COLLECTION_ID_PATH,
      BUILDER_PATH_DEPRECATED,
      BUILDER_PATH,
      BUILDER_CUSTOM_PATH,
    ],
  });
  if (!match) {
    return { entity: FocusEntity.NONE, id: "" };
  }
  if (match.params.apiId) {
    if (match.params.pluginPackageName) {
      return { entity: FocusEntity.QUERY, id: match.params.apiId };
    }
    return { entity: FocusEntity.API, id: match.params.apiId };
  }
  if (match.params.datasourceId) {
    return { entity: FocusEntity.DATASOURCE, id: match.params.datasourceId };
  }
  if (match.params.queryId) {
    return { entity: FocusEntity.QUERY, id: match.params.queryId };
  }
  if (match.params.collectionId) {
    return { entity: FocusEntity.JS_OBJECT, id: match.params.collectionId };
  }
  if (match.params.pageId && hash) {
    return { entity: FocusEntity.PROPERTY_PANE, id: hash };
  }
  return { entity: FocusEntity.CANVAS, id: "" };
}
