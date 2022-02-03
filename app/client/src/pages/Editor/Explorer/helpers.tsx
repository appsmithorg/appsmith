import { IPopoverSharedProps } from "@blueprintjs/core";
import { matchPath, useLocation } from "react-router";
import {
  API_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
} from "constants/routes";

import {
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "pages/Editor/SaaSEditor/constants";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { PluginType } from "entities/Action";

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

export const getActionIdFromURL = () => {
  const apiMatch = matchPath<{ apiId: string }>(window.location.pathname, {
    path: API_EDITOR_ID_PATH,
  });
  if (apiMatch?.params?.apiId) {
    return apiMatch.params.apiId;
  }
  const match = matchPath<{ queryId: string }>(window.location.pathname, {
    path: QUERIES_EDITOR_ID_PATH,
  });
  if (match?.params?.queryId) {
    return match.params.queryId;
  }
  const saasMatch = matchPath<{ apiId: string }>(window.location.pathname, {
    path: SAAS_EDITOR_API_ID_PATH,
  });
  if (saasMatch?.params?.apiId) {
    return saasMatch.params.apiId;
  }
};

export const getJSCollectionIdFromURL = () => {
  const functionMatch = matchPath<{ collectionId: string }>(
    window.location.pathname,
    {
      path: JS_COLLECTION_ID_PATH,
    },
  );
  if (functionMatch?.params?.collectionId) {
    return functionMatch?.params?.collectionId;
  }
};

export const getQueryIdFromURL = () => {
  const match = matchPath<{ queryId: string }>(window.location.pathname, {
    path: QUERIES_EDITOR_ID_PATH,
  });
  if (match?.params?.queryId) {
    return match.params.queryId;
  }
};

export const useDatasourceIdFromURL = () => {
  const location = useLocation();
  const match = matchPath<{ datasourceId: string }>(location.pathname, {
    path: DATA_SOURCES_EDITOR_ID_PATH,
  });
  if (match?.params?.datasourceId) {
    return match.params.datasourceId;
  }
  const saasMatch = matchPath<{ datasourceId: string }>(
    window.location.pathname,
    {
      path: SAAS_EDITOR_DATASOURCE_ID_PATH,
    },
  );
  if (saasMatch?.params?.datasourceId) {
    return saasMatch.params.datasourceId;
  }
};
