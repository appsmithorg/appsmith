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
import { getQueryParamsFromString } from "utils/getQueryParamsObject";

export enum FocusEntity {
  PAGE = "PAGE",
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
  pageId?: string;
};

/**
 * Method to indicate if the URL is of type API, Query etc,
 * and not anything else
 * @param path
 * @returns
 */
export function shouldStoreURLforFocus(path: string) {
  const entityTypesToStore = [
    FocusEntity.QUERY,
    FocusEntity.API,
    FocusEntity.JS_OBJECT,
    FocusEntity.DATASOURCE,
  ];

  const entity = identifyEntityFromPath(path)?.entity;

  return entityTypesToStore.indexOf(entity) >= 0;
}

/**
 * parse search string and get branch
 * @param searchString
 * @returns
 */
const fetchGitBranch = (searchString: string | undefined) => {
  const existingParams =
    getQueryParamsFromString(searchString?.substring(1)) || {};

  return existingParams.branch;
};

/**
 * Compare if both the params are on same branch
 * @param previousParamString
 * @param currentParamStaring
 * @returns
 */
export function isSameBranch(
  previousParamString: string,
  currentParamStaring: string,
) {
  const previousBranch = fetchGitBranch(previousParamString);
  const currentBranch = fetchGitBranch(currentParamStaring);

  return previousBranch === currentBranch;
}

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
    exact: true,
  });
  if (!match) {
    return { entity: FocusEntity.NONE, id: "" };
  }
  if (match.params.apiId) {
    if (match.params.pluginPackageName) {
      return {
        entity: FocusEntity.QUERY,
        id: match.params.apiId,
        pageId: match.params.pageId,
      };
    }
    return {
      entity: FocusEntity.API,
      id: match.params.apiId,
      pageId: match.params.pageId,
    };
  }
  if (match.params.datasourceId) {
    return {
      entity: FocusEntity.DATASOURCE,
      id: match.params.datasourceId,
      pageId: match.params.pageId,
    };
  }
  if (match.params.queryId) {
    return {
      entity: FocusEntity.QUERY,
      id: match.params.queryId,
      pageId: match.params.pageId,
    };
  }
  if (match.params.collectionId) {
    return {
      entity: FocusEntity.JS_OBJECT,
      id: match.params.collectionId,
      pageId: match.params.pageId,
    };
  }
  if (match.params.pageId && hash) {
    return {
      entity: FocusEntity.PROPERTY_PANE,
      id: hash,
      pageId: match.params.pageId,
    };
  }
  return { entity: FocusEntity.CANVAS, id: "", pageId: match.params.pageId };
}
