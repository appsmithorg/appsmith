import { matchPath } from "react-router";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  DATA_SOURCES_EDITOR_ID_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "../constants/routes";
import { shouldStorePageURLForFocus } from "./FocusUtils";
import { FocusEntity, identifyEntityFromPath } from "./FocusEntity";

export const getSelectedDatasourceId = (path: string): string | undefined => {
  const match = matchPath<{ datasourceId?: string }>(path, [
    BUILDER_PATH_DEPRECATED + DATA_SOURCES_EDITOR_ID_PATH,
    BUILDER_PATH + DATA_SOURCES_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + DATA_SOURCES_EDITOR_ID_PATH,
    BUILDER_PATH_DEPRECATED + SAAS_GSHEET_EDITOR_ID_PATH,
    BUILDER_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
  ]);
  if (!match) return undefined;
  return match.params.datasourceId;
};

export const getCurrentPageUrl = (path: string): string | undefined => {
  if (shouldStorePageURLForFocus(path)) {
    return path;
  }
};

export const getCurrentAppUrl = (path: string): string | undefined => {
  const focusInfo = identifyEntityFromPath(path);
  if (focusInfo.entity !== FocusEntity.NONE) {
    return path;
  }
};
