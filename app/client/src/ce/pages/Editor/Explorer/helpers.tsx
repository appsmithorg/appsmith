import type { IPopoverSharedProps } from "@blueprintjs/core";
import { matchPath, useLocation } from "react-router";
import {
  API_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  matchBuilderPath,
  matchViewerPath,
  VIEWER_PATH,
  VIEWER_CUSTOM_PATH,
  VIEWER_PATH_DEPRECATED,
} from "constants/routes";

import {
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "pages/Editor/SaaSEditor/constants";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import type { PluginType } from "entities/Plugin";
import localStorage from "utils/localStorage";
import { EDITOR_PATHS } from "ee/entities/IDE/utils";
import { match, type Match } from "path-to-regexp";

export const ContextMenuPopoverModifiers: IPopoverSharedProps["modifiers"] = {
  offset: {
    enabled: false,
    offset: 200,
  },

  preventOverflow: {
    enabled: true,
    boundariesElement: "viewport",
  },
  hide: {
    enabled: false,
  },
};

export interface ExplorerURLParams {
  basePageId: string;
}

export interface ExplorerFileEntity {
  type: PluginType | "group";
  group?: string;
  entity: ActionData | JSCollectionData;
}

export const matchBasePath = (pathname: string) => {
  const basePathMatch = matchPath(pathname, {
    path: EDITOR_PATHS,
    strict: false,
    exact: false,
  });

  return basePathMatch;
};

export const getActionIdFromURL = () => {
  const baseMatch = matchBasePath(window.location.pathname);

  if (!baseMatch) return;

  const { path: basePath } = baseMatch;
  const apiMatch = matchPath<{ baseApiId: string }>(window.location.pathname, {
    path: `${basePath}${API_EDITOR_ID_PATH}`,
  });

  if (apiMatch?.params?.baseApiId) {
    return apiMatch.params.baseApiId;
  }

  const match = matchPath<{ baseQueryId: string }>(window.location.pathname, {
    path: `${basePath}${QUERIES_EDITOR_ID_PATH}`,
  });

  if (match?.params?.baseQueryId) {
    return match.params.baseQueryId;
  }

  const saasMatch = matchPath<{ baseApiId: string }>(window.location.pathname, {
    path: `${basePath}${SAAS_EDITOR_API_ID_PATH}`,
  });

  if (saasMatch?.params?.baseApiId) {
    return saasMatch.params.baseApiId;
  }
};

export function getAppViewerPageIdFromPath(path: string): string | null {
  const regexes = [VIEWER_PATH, VIEWER_CUSTOM_PATH, VIEWER_PATH_DEPRECATED];

  for (const regex of regexes) {
    const match = matchPath<{ basePageId: string }>(path, { path: regex });

    if (match?.params.basePageId) {
      return match.params.basePageId;
    }
  }

  return null;
}

export const matchEditorPath = (
  path: string,
): Match<{ baseApplicationId: string; basePageId: string }> | false => {
  const result = matchBuilderPath(path, { end: false });
  if (result && 'params' in result) {
    return result as Match<{ baseApplicationId: string; basePageId: string }>;
  }
  return false;
};
export const isEditorPath = (path: string) => {
  return !!matchEditorPath(path);
};

export const isViewerPath = (path: string) => {
  return !!matchViewerPath(path);
};

export const getJSCollectionIdFromURL = () => {
  const baseMatch = matchBasePath(window.location.pathname);

  if (!baseMatch) return;

  const { path: basePath } = baseMatch;
  const functionMatch = matchPath<{ baseCollectionId: string }>(
    window.location.pathname,
    {
      path: `${basePath}${JS_COLLECTION_ID_PATH}`,
    },
  );

  if (functionMatch?.params?.baseCollectionId) {
    return functionMatch?.params?.baseCollectionId;
  }
};

export const getQueryIdFromURL = () => {
  const baseMatch = matchBasePath(window.location.pathname);

  if (!baseMatch) return;

  const { path: basePath } = baseMatch;
  const match = matchPath<{ baseQueryId: string }>(window.location.pathname, {
    path: `${basePath}${QUERIES_EDITOR_ID_PATH}`,
  });

  if (match?.params?.baseQueryId) {
    return match.params.baseQueryId;
  }
};

export const useDatasourceIdFromURL = () => {
  const location = useLocation();
  const baseMatch = matchBasePath(location.pathname);

  if (!baseMatch) return;

  const { path: basePath } = baseMatch;
  const match = matchPath<{ datasourceId: string }>(location.pathname, {
    path: `${basePath}${DATA_SOURCES_EDITOR_ID_PATH}`,
  });

  if (match?.params?.datasourceId) {
    return match.params.datasourceId;
  }

  const saasMatch = matchPath<{ datasourceId: string }>(
    window.location.pathname,
    {
      path: `${basePath}${SAAS_EDITOR_DATASOURCE_ID_PATH}`,
    },
  );

  if (saasMatch?.params?.datasourceId) {
    return saasMatch.params.datasourceId;
  }
};

const EXPLORER_STORAGE_PREFIX = "explorerState_";

export interface ExplorerStateType {
  pages: boolean;
  widgets: boolean;
  queriesAndJs: boolean;
  datasource: boolean;
  packages: boolean;
}

export const getExplorerStatus = (
  resourceId: string,
  entityName: keyof ExplorerStateType,
): boolean | null => {
  const storageItemName = EXPLORER_STORAGE_PREFIX + resourceId;
  const data = localStorage.getItem(storageItemName);

  if (data === null) return null;

  const parsedData: ExplorerStateType = JSON.parse(data);

  return parsedData[entityName];
};

export const saveExplorerStatus = (
  appId: string,
  entityName: keyof ExplorerStateType,
  value: boolean,
): void => {
  const storageItemName = EXPLORER_STORAGE_PREFIX + appId;
  const state = localStorage.getItem(storageItemName);
  let data = {} as ExplorerStateType;

  if (state !== null) {
    data = JSON.parse(state);
  }

  data[entityName] = value;
  localStorage.setItem(storageItemName, JSON.stringify(data));
};
