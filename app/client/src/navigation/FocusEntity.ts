import type { match } from "react-router";
import { matchPath } from "react-router";
import { ADD_PATH } from "constants/routes";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import type { IDEType } from "ee/IDE/Interfaces/IDETypes";
import { EditorState } from "IDE/Interfaces/EditorState";
import { EntityPaths } from "ee/IDE/constants/routes";
import { getBaseUrlsForIDEType, getIDETypeByUrl } from "ee/entities/IDE/utils";
import { memoize } from "lodash";
import { MODULE_TYPE } from "ee/constants/ModuleConstants";

export enum FocusEntity {
  API = "API",
  CANVAS = "CANVAS",
  DATASOURCE_LIST = "DATASOURCE_LIST",
  DATASOURCE = "DATASOURCE",
  DEBUGGER = "DEBUGGER",
  QUERY = "QUERY",
  QUERY_LIST = "QUERY_LIST",
  JS_OBJECT = "JS_OBJECT",
  JS_OBJECT_LIST = "JS_OBJECT_LIST",
  WIDGET = "WIDGET",
  NONE = "NONE",
  APP_STATE = "APP_STATE",
  LIBRARY = "LIBRARY",
  SETTINGS = "SETTINGS",
  WIDGET_LIST = "WIDGET_LIST",
  EDITOR = "EDITOR",
  QUERY_ADD = "QUERY_ADD",
  DATASOURCE_CREATE = "DATASOURCE_CREATE",
  QUERY_MODULE_INSTANCE = "QUERY_MODULE_INSTANCE",
  JS_MODULE_INSTANCE = "JS_MODULE_INSTANCE",
  JS_OBJECT_ADD = "JS_OBJECT_ADD",
  PAGE = "PAGE",
}

export const FocusStoreHierarchy: Partial<Record<FocusEntity, FocusEntity>> = {
  [FocusEntity.WIDGET]: FocusEntity.WIDGET_LIST,
  [FocusEntity.DATASOURCE]: FocusEntity.DATASOURCE_LIST,
  [FocusEntity.JS_OBJECT]: FocusEntity.JS_OBJECT_LIST,
  [FocusEntity.JS_MODULE_INSTANCE]: FocusEntity.JS_OBJECT_LIST,
  [FocusEntity.QUERY]: FocusEntity.QUERY_LIST,
  [FocusEntity.QUERY_MODULE_INSTANCE]: FocusEntity.QUERY_LIST,
};

export interface FocusEntityInfo {
  entity: FocusEntity;
  id: string;
  appState: EditorState;
  params: MatchEntityFromPath;
}

const getMatchPaths = memoize((type: IDEType): string[] => {
  const basePaths = getBaseUrlsForIDEType(type);

  return EntityPaths.reduce((previousValue, currentValue) => {
    const toAdd = basePaths.map((b) => b + currentValue);

    return previousValue.concat(...toAdd);
  }, [] as string[]).concat(basePaths);
});

export interface MatchEntityFromPath {
  baseApplicationId?: string;
  customSlug?: string;
  applicationSlug?: string;
  basePackageId?: string;
  baseModuleId?: string;
  workflowId?: string;
  pageSlug?: string;
  baseApiId?: string;
  datasourceId?: string;
  pluginPackageName?: string;
  baseQueryId?: string;
  appId?: string;
  basePageId?: string;
  baseCollectionId?: string;
  widgetIds?: string;
  selectedTab?: string;
  moduleType?: string;
  moduleInstanceId?: string;
  entity?: string;
}

export function matchEntityFromPath(
  path: string,
): match<MatchEntityFromPath> | null {
  const ideType = getIDETypeByUrl(path);
  const matchPaths = getMatchPaths(ideType);

  return matchPath(path, {
    path: matchPaths,
    exact: true,
  });
}

const getQueryAddPathObj = (match: match<MatchEntityFromPath>) => {
  return {
    entity: FocusEntity.QUERY_ADD,
    id: "",
    appState: EditorState.EDITOR,
    params: match.params,
  };
};

const getJSAddPathObj = (match: match<MatchEntityFromPath>) => {
  return {
    entity: FocusEntity.JS_OBJECT_ADD,
    id: "",
    appState: EditorState.EDITOR,
    params: match.params,
  };
};

export function identifyEntityFromPath(path: string): FocusEntityInfo {
  const match = matchEntityFromPath(path);

  if (!match) {
    return {
      entity: FocusEntity.NONE,
      id: "",
      appState: EditorState.EDITOR,
      params: {},
    };
  }

  if (match.params.baseApiId) {
    if (match.params.pluginPackageName) {
      if (match.url.endsWith(ADD_PATH)) {
        return getQueryAddPathObj(match);
      }

      return {
        entity: FocusEntity.QUERY,
        id: match.params.baseApiId,
        appState: EditorState.EDITOR,
        params: match.params,
      };
    }

    if (match.url.endsWith(ADD_PATH)) {
      return getQueryAddPathObj(match);
    }

    return {
      entity: FocusEntity.QUERY,
      id: match.params.baseApiId,
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

  if (match.params.baseQueryId) {
    if (match.params.baseQueryId == "add" || match.url.endsWith(ADD_PATH)) {
      return getQueryAddPathObj(match);
    }

    return {
      entity: FocusEntity.QUERY,
      id: match.params.baseQueryId,
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }

  if (match.params.moduleType && match.params.moduleInstanceId) {
    if (match.params.moduleType === MODULE_TYPE.QUERY) {
      if (match.url.endsWith(ADD_PATH)) {
        return getQueryAddPathObj(match);
      }

      return {
        entity: FocusEntity.QUERY_MODULE_INSTANCE,
        id: match.params.moduleInstanceId,
        appState: EditorState.EDITOR,
        params: match.params,
      };
    }

    if (match.params.moduleType === MODULE_TYPE.JS) {
      if (match.url.endsWith(ADD_PATH)) {
        return getJSAddPathObj(match);
      }

      return {
        entity: FocusEntity.JS_MODULE_INSTANCE,
        id: match.params.moduleInstanceId,
        appState: EditorState.EDITOR,
        params: match.params,
      };
    }
  }

  if (match.params.baseCollectionId) {
    if (
      match.params.baseCollectionId == "add" ||
      match.url.endsWith(ADD_PATH)
    ) {
      return getJSAddPathObj(match);
    }

    return {
      entity: FocusEntity.JS_OBJECT,
      id: match.params.baseCollectionId,
      appState: EditorState.EDITOR,
      params: match.params,
    };
  }

  if (match.params.widgetIds) {
    return {
      entity: FocusEntity.WIDGET,
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
    if (
      match.params.entity === "libraries" ||
      match.params.entity === "packages"
    ) {
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

  return {
    entity: FocusEntity.CANVAS,
    id: "",
    appState: EditorState.EDITOR,
    params: match.params,
  };
}
