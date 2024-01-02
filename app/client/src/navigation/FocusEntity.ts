import type { match } from "react-router";
import { matchPath } from "react-router";
import { ADD_PATH, CURL_IMPORT_PAGE_PATH } from "constants/routes";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { IDEType } from "@appsmith/entities/IDE/constants";
import { EditorState, EntityPaths } from "@appsmith/entities/IDE/constants";
import { getBaseUrlsForIDEType } from "@appsmith/entities/IDE/utils";
import { memoize } from "lodash";

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
  WIDGET_LIST = "WIDGET_LIST",
  EDITOR = "EDITOR",
  QUERY_ADD = "QUERY_ADD",
  DATASOURCE_CREATE = "DATASOURCE_CREATE",
}

export const FocusStoreHierarchy: Partial<Record<FocusEntity, FocusEntity>> = {
  [FocusEntity.PROPERTY_PANE]: FocusEntity.WIDGET_LIST,
  [FocusEntity.DATASOURCE]: FocusEntity.DATASOURCE_LIST,
  [FocusEntity.JS_OBJECT]: FocusEntity.JS_OBJECT_LIST,
  [FocusEntity.QUERY]: FocusEntity.QUERY_LIST,
};

export interface FocusEntityInfo {
  entity: FocusEntity;
  id: string;
  appState: EditorState;
  params: {
    pageId?: string;
  };
}

const getMatchPaths = memoize((type: IDEType): string[] => {
  const basePaths = getBaseUrlsForIDEType(type);
  return EntityPaths.reduce((previousValue, currentValue) => {
    const toAdd = basePaths.map((b) => b + currentValue);
    return previousValue.concat(...toAdd);
  }, [] as string[]);
});

function matchEntityFromPath(
  path: string,
  IDEType: IDEType,
): match<{
  apiId?: string;
  datasourceId?: string;
  pluginPackageName?: string;
  queryId?: string;
  appId?: string;
  pageId?: string;
  collectionId?: string;
  widgetIds?: string;
  selectedTab?: string;
  entity?: string;
}> | null {
  const matchPaths = getMatchPaths(IDEType);
  return matchPath(path, {
    path: matchPaths,
    exact: true,
  });
}

export function identifyEntityFromPath(
  path: string,
  type = IDEType.App,
): FocusEntityInfo {
  const match = matchEntityFromPath(path, type);
  if (!match) {
    return {
      entity: FocusEntity.NONE,
      id: "",
      appState: EditorState.EDITOR,
      params: {},
    };
  }
  if (match.params.apiId) {
    if (match.params.pluginPackageName) {
      return {
        entity: FocusEntity.QUERY,
        id: match.params.apiId,
        appState: EditorState.EDITOR,
        params: match.params,
      };
    }
    return {
      entity: FocusEntity.QUERY,
      id: match.params.apiId,
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  if (match.params.datasourceId) {
    if (match.params.datasourceId == TEMP_DATASOURCE_ID) {
      return {
        entity: FocusEntity.NONE,
        id: match.params.datasourceId,
        appState: EditorState.DATA,
        params: match.params,
      };
    } else {
      return {
        entity: FocusEntity.DATASOURCE,
        id: match.params.datasourceId,
        appState: EditorState.DATA,
        params: match.params,
      };
    }
  }
  if (match.params.selectedTab) {
    return {
      entity: FocusEntity.DATASOURCE_CREATE,
      id: match.params.selectedTab,
      appState: EditorState.DATA,
      params: match.params,
    };
  }
  if (match.params.entity === "datasource") {
    return {
      entity: FocusEntity.DATASOURCE_LIST,
      id: "",
      appState: EditorState.DATA,
      params: match.params,
    };
  }
  if (match.params.queryId) {
    if (match.params.queryId == "add") {
      return {
        entity: FocusEntity.QUERY_ADD,
        id: "",
        appState: EditorState.EDITOR,
        params: match.params,
      };
    }
    return {
      entity: FocusEntity.QUERY,
      id: match.params.queryId,
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  if (match.params.collectionId) {
    return {
      entity: FocusEntity.JS_OBJECT,
      id: match.params.collectionId,
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  if (match.params.widgetIds) {
    return {
      entity: FocusEntity.PROPERTY_PANE,
      id: match.params.widgetIds,
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  if (match.params.entity === "widgets") {
    return {
      entity: FocusEntity.WIDGET_LIST,
      id: "",
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  if (match.params.entity === "queries") {
    return {
      entity: FocusEntity.QUERY_LIST,
      id: "",
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  if (match.params.entity === "jsObjects") {
    return {
      entity: FocusEntity.JS_OBJECT_LIST,
      id: "",
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  if (match.params.entity) {
    if (match.params.entity === "libraries") {
      return {
        entity: FocusEntity.LIBRARY,
        id: "",
        appState: EditorState.LIBRARIES,
        params: match.params,
      };
    }
    if (match.params.entity === "settings") {
      return {
        entity: FocusEntity.SETTINGS,
        id: "",
        appState: EditorState.SETTINGS,
        params: match.params,
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
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }
  return {
    entity: FocusEntity.CANVAS,
    id: "",
    appState: EditorState.EDITOR,
    params: match.params,
  };
}
