import { matchPath } from "react-router";
import match, { type TokensToRegexpOptions } from "path-to-regexp";

// Regex to extract the id from the URL path which supports both the formats:
// 1. With Mongo ObjectIds
// 2. With UUID
const MONGO_OBJECT_ID_REGEX = "[0-9a-f]{24}";
const UUID_REGEX =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export const ID_EXTRACTION_REGEX = `(${MONGO_OBJECT_ID_REGEX}|${UUID_REGEX})`;

export const BUILDER_BASE_PATH_DEPRECATED = "/applications";
export const BUILDER_VIEWER_PATH_PREFIX = "/app/";
export const BUILDER_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:applicationSlug/:pageSlug(.*\-):basePageId${ID_EXTRACTION_REGEX}/edit`;
export const BUILDER_CUSTOM_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:customSlug(.*\-):basePageId${ID_EXTRACTION_REGEX}/edit`;
export const VIEWER_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:applicationSlug/:pageSlug(.*\-):basePageId${ID_EXTRACTION_REGEX}`;
export const VIEWER_CUSTOM_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:customSlug(.*\-):basePageId${ID_EXTRACTION_REGEX}`;
export const getViewerPath = (
  applicationSlug: string,
  pageSlug: string,
  basePageId: string,
) =>
  `${BUILDER_VIEWER_PATH_PREFIX}${applicationSlug}/${pageSlug}-${basePageId}`;
export const getViewerCustomPath = (customSlug: string, basePageId: string) =>
  `${BUILDER_VIEWER_PATH_PREFIX}${customSlug}-${basePageId}`;
export const BUILDER_PATH_DEPRECATED = `/applications/:baseApplicationId${ID_EXTRACTION_REGEX}/pages/:basePageId${ID_EXTRACTION_REGEX}/edit`;
export const VIEWER_PATH_DEPRECATED = `/applications/:baseApplicationId${ID_EXTRACTION_REGEX}/pages/:basePageId${ID_EXTRACTION_REGEX}`;
export const VIEWER_PATH_DEPRECATED_REGEX =
  /\/applications\/[^/]+\/pages\/[^/]+/;

export const VIEWER_FORK_PATH = `/fork`;
export const INTEGRATION_EDITOR_PATH = `/datasources/:selectedTab`;

export const WIDGETS_EDITOR_BASE_PATH = `/widgets`;
export const WIDGETS_EDITOR_ID_PATH = `${WIDGETS_EDITOR_BASE_PATH}/:widgetIds`;

/*
 * CUSTOM WIDGET BUILDER PATHS
 */
export const CUSTOM_WIDGETS_EDITOR_ID_PATH = `${BUILDER_PATH}${WIDGETS_EDITOR_ID_PATH}/builder`;
export const CUSTOM_WIDGETS_EDITOR_ID_PATH_CUSTOM = `${BUILDER_CUSTOM_PATH}${WIDGETS_EDITOR_ID_PATH}/builder`;
export const CUSTOM_WIDGETS_DEPRECATED_EDITOR_ID_PATH = `${BUILDER_PATH_DEPRECATED}${WIDGETS_EDITOR_ID_PATH}/builder`;
/* */

export const API_EDITOR_BASE_PATH = `/api`;
export const API_EDITOR_ID_PATH = `${API_EDITOR_BASE_PATH}/:baseApiId`;
export const API_EDITOR_ID_ADD_PATH = `${API_EDITOR_BASE_PATH}/:baseApiId/add`;
export const API_EDITOR_PATH_WITH_SELECTED_PAGE_ID = `${API_EDITOR_BASE_PATH}?importTo=:importTo`;
export const QUERIES_EDITOR_BASE_PATH = `/queries`;
export const ADD_PATH = `/add`;
export const LIST_PATH = "/list";

export const ENTITY_PATH = "/:entity";
export const QUERIES_EDITOR_ID_PATH = `${QUERIES_EDITOR_BASE_PATH}/:baseQueryId`;
export const QUERIES_EDITOR_ADD_PATH = `${QUERIES_EDITOR_BASE_PATH}${ADD_PATH}`;
export const QUERIES_EDITOR_ID_ADD_PATH = `${QUERIES_EDITOR_BASE_PATH}/:baseQueryId/add`;
export const JS_COLLECTION_EDITOR_PATH = `/jsObjects`;
export const JS_COLLECTION_ID_PATH = `${JS_COLLECTION_EDITOR_PATH}/:baseCollectionId`;
export const JS_COLLECTION_ID_ADD_PATH = `${JS_COLLECTION_EDITOR_PATH}/:baseCollectionId/add`;
export const DATA_SOURCES_EDITOR_LIST_PATH = `/datasource`;
export const DATA_SOURCES_EDITOR_ID_PATH = `/datasource/:datasourceId`;
export const APP_LIBRARIES_EDITOR_PATH = `/libraries`;
export const APP_PACKAGES_EDITOR_PATH = `/packages`;
export const APP_SETTINGS_EDITOR_PATH = `/settings`;
export const SAAS_GSHEET_EDITOR_ID_PATH = `/saas/google-sheets-plugin/datasources/:datasourceId`;
export const BUILDER_CHECKLIST_PATH = `/checklist`;
export const ADMIN_SETTINGS_PATH = "/settings";
export const ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH = "/settings/general";
export const ADMIN_SETTINGS_CATEGORY_ACL_PATH = "/settings/groups";
export const ADMIN_SETTINGS_CATEGORY_AUDIT_LOGS_PATH = "/settings/audit-logs";
export const ADMIN_SETTINGS_CATEGORY_PATH = "/settings/:category/:selected?";
export const BUILDER_PATCH_PATH = `/:applicationSlug/:pageSlug(.*\-):basePageId${ID_EXTRACTION_REGEX}/edit`;
export const VIEWER_PATCH_PATH = `/:applicationSlug/:pageSlug(.*\-):basePageId${ID_EXTRACTION_REGEX}`;

export const matchApiBasePath = match(API_EDITOR_BASE_PATH);
export const matchApiPath = match(API_EDITOR_ID_PATH);
export const matchDatasourcePath = (pathname: string) =>
  matchPath(pathname, {
    path: [`${BUILDER_PATH}${DATA_SOURCES_EDITOR_ID_PATH}`],
    strict: false,
    exact: false,
  });

export const matchSAASGsheetsPath = (pathname: string) =>
  matchPath(pathname, {
    path: [`${BUILDER_PATH}${SAAS_GSHEET_EDITOR_ID_PATH}`],
    strict: false,
    exact: false,
  });
export const matchQueryBasePath = match(QUERIES_EDITOR_BASE_PATH);
export const matchQueryPath = match(QUERIES_EDITOR_ID_PATH);
export const matchQueryBuilderPath = match(
  BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
);
export const matchBuilderPath = (
  pathName: string,
  options?: TokensToRegexpOptions,
) =>
  match(BUILDER_PATH, options)(pathName) ||
  match(BUILDER_PATH_DEPRECATED, options)(pathName) ||
  match(BUILDER_CUSTOM_PATH, options)(pathName) ||
  match(BUILDER_PATH + WIDGETS_EDITOR_ID_PATH, options)(pathName) ||
  match(BUILDER_CUSTOM_PATH + WIDGETS_EDITOR_ID_PATH, options)(pathName) ||
  match(BUILDER_PATH_DEPRECATED + WIDGETS_EDITOR_ID_PATH, options)(pathName) ||
  match(BUILDER_PATH + WIDGETS_EDITOR_ID_PATH + ADD_PATH, options)(pathName);

export const matchJSObjectPath = match(JS_COLLECTION_ID_PATH);
export const matchViewerPath = (pathName: string) =>
  match(VIEWER_PATH)(pathName) ||
  match(VIEWER_PATH_DEPRECATED)(pathName) ||
  match(VIEWER_CUSTOM_PATH)(pathName);
export const matchViewerForkPath = (pathName: string) =>
  match(`${VIEWER_PATH}${VIEWER_FORK_PATH}`)(pathName) ||
  match(`${VIEWER_CUSTOM_PATH}${VIEWER_FORK_PATH}`)(pathName) ||
  match(`${VIEWER_PATH_DEPRECATED}${VIEWER_FORK_PATH}`)(pathName);

export const matchAppLibrariesPath = (pathName: string) =>
  match(`${BUILDER_PATH}${APP_LIBRARIES_EDITOR_PATH}`)(pathName);

export const matchAppPackagesPath = (pathName: string) =>
  match(`${BUILDER_PATH}${APP_PACKAGES_EDITOR_PATH}`)(pathName);

export const addBranchParam = (branch: string) => {
  const url = new URL(window.location.href);

  url.searchParams.set(GIT_BRANCH_QUERY_KEY, encodeURIComponent(branch));

  return url.toString().slice(url.origin.length);
};

export interface BuilderRouteParams {
  basePageId: string;
  baseApplicationId: string;
}

export interface AppViewerRouteParams {
  basePageId: string;
  baseApplicationId?: string;
}

export interface APIEditorRouteParams {
  basePageId: string;
  baseApiId?: string;
}

export interface QueryEditorRouteParams {
  basePageId: string;
  baseQueryId?: string;
  baseApiId?: string;
}

export interface JSEditorRouteParams {
  basePageId: string;
  baseCollectionId?: string;
}

export const GIT_BRANCH_QUERY_KEY = "branch";

export const INTEGRATION_TABS = {
  ACTIVE: "ACTIVE",
  NEW: "NEW",
};

export const INTEGRATION_EDITOR_MODES = {
  AUTO: "auto",
  MOCK: "mock",
};

export const PLACEHOLDER_APP_SLUG = "application";
export const PLACEHOLDER_PAGE_ID = "basePageId";
export const PLACEHOLDER_PAGE_SLUG = "page";

export const SHOW_FILE_PICKER_KEY = "showPicker";
export const RESPONSE_STATUS = "response_status";

export const basePathForActiveAction = [BUILDER_PATH, BUILDER_PATH_DEPRECATED];
