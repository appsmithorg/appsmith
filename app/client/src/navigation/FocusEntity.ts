import { matchPath } from "react-router";
import {
  API_EDITOR_ID_ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  ADD_PATH,
  QUERIES_EDITOR_ID_ADD_PATH,
  QUERIES_EDITOR_ID_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import {
  SAAS_EDITOR_API_ID_ADD_PATH,
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "pages/Editor/SaaSEditor/constants";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { EditorState } from "../entities/IDE/constants";

export enum FocusEntity {
  PAGE = "PAGE",
  API = "API",
  CANVAS = "CANVAS",
  DATASOURCE_LIST = "DATASOURCE_LIST",
  DATASOURCE = "DATASOURCE",
  DEBUGGER = "DEBUGGER",
  QUERY = "QUERY",
  QUERY_LIST = "QUERY_LIST",
  JS_OBJECT = "JS_OBJECT",
  JS_OBJECT_LIST = "JS_OBJECT_LIST",
  PROPERTY_PANE = "PROPERTY_PANE",
  NONE = "NONE",
  APP_STATE = "APP_STATE",
  LIBRARY = "LIBRARY",
  SETTINGS = "SETTINGS",
}

export const FocusStoreHierarchy: Partial<Record<FocusEntity, FocusEntity>> = {
  [FocusEntity.PROPERTY_PANE]: FocusEntity.CANVAS,
  [FocusEntity.DATASOURCE]: FocusEntity.DATASOURCE_LIST,
  [FocusEntity.JS_OBJECT]: FocusEntity.JS_OBJECT_LIST,
  [FocusEntity.QUERY]: FocusEntity.QUERY_LIST,
};

export interface FocusEntityInfo {
  entity: FocusEntity;
  id: string;
  appState: EditorState;
  pageId?: string;
}

export function identifyEntityFromPath(path: string): FocusEntityInfo {
  const match = matchPath<{
    apiId?: string;
    datasourceId?: string;
    pluginPackageName?: string;
    queryId?: string;
    appId?: string;
    pageId?: string;
    collectionId?: string;
    widgetIds?: string;
    selectedTab?: string; // Datasource creation/list screen
    entity?: string;
  }>(path, {
    path: [
      BUILDER_PATH_DEPRECATED + API_EDITOR_ID_ADD_PATH,
      BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
      BUILDER_PATH + API_EDITOR_ID_ADD_PATH,
      BUILDER_PATH + API_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + API_EDITOR_ID_ADD_PATH,
      BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_ADD_PATH,
      BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_PATH,
      BUILDER_PATH + QUERIES_EDITOR_ID_ADD_PATH,
      BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_ADD_PATH,
      BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + DATA_SOURCES_EDITOR_ID_PATH,
      BUILDER_PATH + DATA_SOURCES_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + DATA_SOURCES_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + INTEGRATION_EDITOR_PATH,
      BUILDER_PATH + INTEGRATION_EDITOR_PATH,
      BUILDER_CUSTOM_PATH + INTEGRATION_EDITOR_PATH,
      BUILDER_PATH + SAAS_EDITOR_DATASOURCE_ID_PATH,
      BUILDER_CUSTOM_PATH + SAAS_EDITOR_DATASOURCE_ID_PATH,
      BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_ADD_PATH,
      BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
      BUILDER_PATH + SAAS_EDITOR_API_ID_ADD_PATH,
      BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
      BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_ADD_PATH,
      BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
      BUILDER_PATH_DEPRECATED + JS_COLLECTION_ID_PATH,
      BUILDER_PATH + JS_COLLECTION_ID_PATH,
      BUILDER_CUSTOM_PATH + JS_COLLECTION_ID_PATH,
      BUILDER_PATH + WIDGETS_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + WIDGETS_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + WIDGETS_EDITOR_ID_PATH,
      BUILDER_PATH + CURL_IMPORT_PAGE_PATH,
      BUILDER_PATH + CURL_IMPORT_PAGE_PATH + ADD_PATH,
      BUILDER_PATH + "/:entity",
      BUILDER_CUSTOM_PATH + "/:entity",
      BUILDER_PATH_DEPRECATED + "/:entity",
      BUILDER_PATH_DEPRECATED,
      BUILDER_PATH,
      BUILDER_CUSTOM_PATH,
    ],
    exact: true,
  });
  if (!match) {
    return {
      entity: FocusEntity.NONE,
      id: "",
      pageId: "",
      appState: EditorState.EDITOR,
    };
  }
  if (match.params.apiId) {
    if (match.params.pluginPackageName) {
      return {
        entity: FocusEntity.QUERY,
        id: match.params.apiId,
        pageId: match.params.pageId,
        appState: EditorState.EDITOR,
      };
    }
    return {
      entity: FocusEntity.QUERY,
      id: match.params.apiId,
      pageId: match.params.pageId,
      appState: EditorState.EDITOR,
    };
  }
  if (match.params.datasourceId) {
    if (match.params.datasourceId == TEMP_DATASOURCE_ID) {
      return {
        entity: FocusEntity.NONE,
        id: match.params.datasourceId,
        pageId: match.params.pageId,
        appState: EditorState.DATA,
      };
    } else {
      return {
        entity: FocusEntity.DATASOURCE,
        id: match.params.datasourceId,
        pageId: match.params.pageId,
        appState: EditorState.DATA,
      };
    }
  }
  if (match.params.selectedTab) {
    return {
      entity: FocusEntity.DATASOURCE,
      id: match.params.selectedTab,
      pageId: match.params.pageId,
      appState: EditorState.DATA,
    };
  }
  if (match.params.entity === "datasource") {
    return {
      entity: FocusEntity.DATASOURCE_LIST,
      id: "",
      pageId: match.params.pageId,
      appState: EditorState.DATA,
    };
  }
  if (match.params.queryId) {
    return {
      entity: FocusEntity.QUERY,
      id: match.params.queryId,
      pageId: match.params.pageId,
      appState: EditorState.EDITOR,
    };
  }
  if (match.params.collectionId) {
    return {
      entity: FocusEntity.JS_OBJECT,
      id: match.params.collectionId,
      pageId: match.params.pageId,
      appState: EditorState.EDITOR,
    };
  }
  if (match.params.widgetIds) {
    return {
      entity: FocusEntity.PROPERTY_PANE,
      id: match.params.widgetIds,
      pageId: match.params.pageId,
      appState: EditorState.EDITOR,
    };
  }
  if (match.params.entity === "queries") {
    return {
      entity: FocusEntity.QUERY_LIST,
      id: "",
      pageId: match.params.pageId,
      appState: EditorState.EDITOR,
    };
  }
  if (match.params.entity === "jsObjects") {
    return {
      entity: FocusEntity.JS_OBJECT_LIST,
      id: "",
      pageId: match.params.pageId,
      appState: EditorState.EDITOR,
    };
  }
  if (match.params.entity) {
    if (match.params.entity === "libraries") {
      return {
        entity: FocusEntity.LIBRARY,
        id: "",
        appState: EditorState.LIBRARIES,
        pageId: match.params.pageId,
      };
    }
    if (match.params.entity === "settings") {
      return {
        entity: FocusEntity.SETTINGS,
        id: "",
        appState: EditorState.SETTINGS,
        pageId: match.params.pageId,
      };
    }
  }
  if (
    match.url.endsWith(CURL_IMPORT_PAGE_PATH) ||
    match.url.endsWith(CURL_IMPORT_PAGE_PATH + ADD_PATH)
  ) {
    return {
      entity: FocusEntity.QUERY,
      id: "",
      pageId: match.params.pageId,
      appState: EditorState.EDITOR,
    };
  }
  return {
    entity: FocusEntity.CANVAS,
    id: "",
    pageId: match.params.pageId,
    appState: EditorState.EDITOR,
  };
}
