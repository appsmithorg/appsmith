import { IPopoverSharedProps } from "@blueprintjs/core";
import { matchPath } from "react-router";
import {
  API_EDITOR_ID_URL,
  QUERIES_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_ID_URL,
} from "constants/routes";
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
};

export const getDatasourceIdFromURL = () => {
  const match = matchPath<{ datasourceId: string }>(window.location.pathname, {
    path: DATA_SOURCES_EDITOR_ID_URL(),
  });
  if (match?.params?.datasourceId) {
    return match.params.datasourceId;
  }
};
