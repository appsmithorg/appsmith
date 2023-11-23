import { matchPath } from "react-router";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  DATA_SOURCES_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
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

export const getSelectedQueryId = (path: string): string | undefined => {
  const match = matchPath<{ queryId?: string }>(path, [
    BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_PATH,
    BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_PATH,
  ]);
  if (!match) return undefined;
  return match.params.queryId;
};

export const getSelectedJSObjectId = (path: string): string | undefined => {
  const match = matchPath<{ collectionId?: string }>(path, [
    BUILDER_PATH_DEPRECATED + JS_COLLECTION_ID_PATH,
    BUILDER_PATH + JS_COLLECTION_ID_PATH,
    BUILDER_CUSTOM_PATH + JS_COLLECTION_ID_PATH,
  ]);
  if (!match) return undefined;
  return match.params.collectionId;
};
