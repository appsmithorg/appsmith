import { IPopoverSharedProps } from "@blueprintjs/core";
import { matchPath } from "react-router";
import {
  API_EDITOR_ID_URL,
  QUERIES_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  JS_COLLECTION_ID_URL,
} from "constants/routes";
import {
  SAAS_EDITOR_API_ID_URL,
  SAAS_EDITOR_DATASOURCE_ID_URL,
} from "../SaaSEditor/constants";
export const ContextMenuPopoverModifiers: IPopoverSharedProps["modifiers"] = {
  offset: {
    enabled: true,
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
  applicationId: string;
  pageId: string;
};

export const getActionIdFromURL = () => {
  const apiMatch = matchPath<{ apiId: string }>(window.location.pathname, {
    path: API_EDITOR_ID_URL(),
  });
  if (apiMatch?.params?.apiId) {
    return apiMatch.params.apiId;
  }
  const match = matchPath<{ queryId: string }>(window.location.pathname, {
    path: QUERIES_EDITOR_ID_URL(),
  });
  if (match?.params?.queryId) {
    return match.params.queryId;
  }
  const saasMatch = matchPath<{ apiId: string }>(window.location.pathname, {
    path: SAAS_EDITOR_API_ID_URL(),
  });
  if (saasMatch?.params?.apiId) {
    return saasMatch.params.apiId;
  }
};

export const getJSCollectionIdFromURL = () => {
  const functionMatch = matchPath<{ collectionId: string }>(
    window.location.pathname,
    {
      path: JS_COLLECTION_ID_URL(),
    },
  );
  if (functionMatch?.params?.collectionId) {
    return functionMatch?.params?.collectionId;
  }
};

export const getQueryIdFromURL = () => {
  const match = matchPath<{ queryId: string }>(window.location.pathname, {
    path: QUERIES_EDITOR_ID_URL(),
  });
  if (match?.params?.queryId) {
    return match.params.queryId;
  }
};

export const getDatasourceIdFromURL = () => {
  const match = matchPath<{ datasourceId: string }>(window.location.pathname, {
    path: DATA_SOURCES_EDITOR_ID_URL(),
  });
  if (match?.params?.datasourceId) {
    return match.params.datasourceId;
  }
  const saasMatch = matchPath<{ datasourceId: string }>(
    window.location.pathname,
    {
      path: SAAS_EDITOR_DATASOURCE_ID_URL(),
    },
  );
  if (saasMatch?.params?.datasourceId) {
    return saasMatch.params.datasourceId;
  }
};
