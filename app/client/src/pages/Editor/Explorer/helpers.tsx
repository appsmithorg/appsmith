import { IPopoverSharedProps } from "@blueprintjs/core";
import { matchPath, useLocation } from "react-router";
import {
  API_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  BUILDER_PATH_DEPRECATED,
  BUILDER_PATH,
  BUILDER_CUSTOM_PATH,
} from "constants/routes";

import {
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "pages/Editor/SaaSEditor/constants";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { PluginType } from "entities/Action";
import localStorage from "utils/localStorage";

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

export type ExplorerURLParams = {
  pageId: string;
};

export type ExplorerFileEntity = {
  type: PluginType | "group";
  group?: string;
  entity: ActionData | JSCollectionData;
};

export const matchBasePath = (pathname: string) => {
  const basePathMatch = matchPath(pathname, {
    path: [BUILDER_PATH_DEPRECATED, BUILDER_PATH, BUILDER_CUSTOM_PATH],
    strict: false,
    exact: false,
  });
  return basePathMatch;
};

export const getActionIdFromURL = () => {
  const baseMatch = matchBasePath(window.location.pathname);
  if (!baseMatch) return;
  const { path: basePath } = baseMatch;
  const apiMatch = matchPath<{ apiId: string }>(window.location.pathname, {
    path: `${basePath}${API_EDITOR_ID_PATH}`,
  });
  if (apiMatch?.params?.apiId) {
    return apiMatch.params.apiId;
  }
  const match = matchPath<{ queryId: string }>(window.location.pathname, {
    path: `${basePath}${QUERIES_EDITOR_ID_PATH}`,
  });
  if (match?.params?.queryId) {
    return match.params.queryId;
  }
  const saasMatch = matchPath<{ apiId: string }>(window.location.pathname, {
    path: `${basePath}${SAAS_EDITOR_API_ID_PATH}`,
  });
  if (saasMatch?.params?.apiId) {
    return saasMatch.params.apiId;
  }
};

export const getJSCollectionIdFromURL = () => {
  const baseMatch = matchBasePath(window.location.pathname);
  if (!baseMatch) return;
  const { path: basePath } = baseMatch;
  const functionMatch = matchPath<{ collectionId: string }>(
    window.location.pathname,
    {
      path: `${basePath}${JS_COLLECTION_ID_PATH}`,
    },
  );
  if (functionMatch?.params?.collectionId) {
    return functionMatch?.params?.collectionId;
  }
};

export const getQueryIdFromURL = () => {
  const baseMatch = matchBasePath(window.location.pathname);
  if (!baseMatch) return;
  const { path: basePath } = baseMatch;
  const match = matchPath<{ queryId: string }>(window.location.pathname, {
    path: `${basePath}${QUERIES_EDITOR_ID_PATH}`,
  });
  if (match?.params?.queryId) {
    return match.params.queryId;
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

export type ExplorerStateType = {
  pages: boolean;
  widgets: boolean;
  queriesAndJs: boolean;
  datasource: boolean;
};

export const getExplorerStatus = (
  appId: string,
  entityName: keyof ExplorerStateType,
): boolean | null => {
  const storageItemName = EXPLORER_STORAGE_PREFIX + appId;
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
  let data: ExplorerStateType = {
    pages: false,
    widgets: false,
    queriesAndJs: false,
    datasource: false,
  };
  if (state !== null) {
    data = JSON.parse(state);
  }
  data[entityName] = value;
  localStorage.setItem(storageItemName, JSON.stringify(data));
};
