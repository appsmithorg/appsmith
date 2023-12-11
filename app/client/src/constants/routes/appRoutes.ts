// Leaving this require here. The path-to-regexp module has a commonJS version and an ESM one.
// We are loading the correct one with the typings with our compilerOptions property "moduleResolution" set to "node". Ref: https://stackoverflow.com/questions/59013618/unable-to-find-module-path-to-regexp
// All solutions from closed issues on their repo have been tried. Ref: https://github.com/pillarjs/path-to-regexp/issues/193
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { match } = require("path-to-regexp");

export const BUILDER_BASE_PATH_DEPRECATED = "/applications";
export const BUILDER_VIEWER_PATH_PREFIX = "/app/";
export const BUILDER_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:applicationSlug/:pageSlug(.*\-):pageId/edit`;
export const BUILDER_CUSTOM_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:customSlug(.*\-):pageId/edit`;
export const VIEWER_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:applicationSlug/:pageSlug(.*\-):pageId`;
export const VIEWER_CUSTOM_PATH = `${BUILDER_VIEWER_PATH_PREFIX}:customSlug(.*\-):pageId`;
export const getViewerPath = (
  applicationSlug: string,
  pageSlug: string,
  pageId: string,
) => `${BUILDER_VIEWER_PATH_PREFIX}${applicationSlug}/${pageSlug}-${pageId}`;
export const getViewerCustomPath = (customSlug: string, pageId: string) =>
  `${BUILDER_VIEWER_PATH_PREFIX}${customSlug}-${pageId}`;
export const BUILDER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId/edit`;
export const VIEWER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId`;
export const VIEWER_PATH_DEPRECATED_REGEX =
  /\/applications\/[^/]+\/pages\/[^/]+/;

export const VIEWER_FORK_PATH = `/fork`;
export const INTEGRATION_EDITOR_PATH = `/datasources/:selectedTab`;

export const WIDGETS_EDITOR_BASE_PATH = `/widgets`;
export const WIDGETS_EDITOR_ID_PATH = `${WIDGETS_EDITOR_BASE_PATH}/:widgetIds`;
export const API_EDITOR_BASE_PATH = `/api`;
export const API_EDITOR_ID_PATH = `${API_EDITOR_BASE_PATH}/:apiId`;
export const API_EDITOR_ID_ADD_PATH = `${API_EDITOR_BASE_PATH}/:apiId/add`;
export const API_EDITOR_PATH_WITH_SELECTED_PAGE_ID = `${API_EDITOR_BASE_PATH}?importTo=:importTo`;
export const QUERIES_EDITOR_BASE_PATH = `/queries`;
export const ADD_PATH = `/add`;
export const QUERIES_EDITOR_ID_PATH = `${QUERIES_EDITOR_BASE_PATH}/:queryId`;
export const QUERIES_EDITOR_ID_ADD_PATH = `${QUERIES_EDITOR_BASE_PATH}/:queryId/add`;
export const JS_COLLECTION_EDITOR_PATH = `/jsObjects`;
export const JS_COLLECTION_ID_PATH = `${JS_COLLECTION_EDITOR_PATH}/:collectionId`;
export const CURL_IMPORT_PAGE_PATH = `/api/curl/curl-import`;
export const DATA_SOURCES_EDITOR_LIST_PATH = `/datasource`;
export const DATA_SOURCES_EDITOR_ID_PATH = `/datasource/:datasourceId`;
export const APP_LIBRARIES_EDITOR_PATH = `/libraries`;
export const APP_SETTINGS_EDITOR_PATH = `/settings`;
export const SAAS_GSHEET_EDITOR_ID_PATH = `/saas/google-sheets-plugin/datasources/:datasourceId`;
export const PROVIDER_TEMPLATE_PATH = `/provider/:providerId`;
export const GEN_TEMPLATE_URL = "generate-page";
export const GENERATE_TEMPLATE_PATH = `/${GEN_TEMPLATE_URL}`;
export const GEN_TEMPLATE_FORM_ROUTE = "/form";
export const GENERATE_TEMPLATE_FORM_PATH = `${GENERATE_TEMPLATE_PATH}${GEN_TEMPLATE_FORM_ROUTE}`;
export const BUILDER_CHECKLIST_PATH = `/checklist`;
export const ADMIN_SETTINGS_PATH = "/settings";
export const ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH = "/settings/general";
export const ADMIN_SETTINGS_CATEGORY_ACL_PATH = "/settings/groups";
export const ADMIN_SETTINGS_CATEGORY_AUDIT_LOGS_PATH = "/settings/audit-logs";
export const ADMIN_SETTINGS_CATEGORY_PATH = "/settings/:category/:selected?";
export const BUILDER_PATCH_PATH = `/:applicationSlug/:pageSlug(.*\-):pageId/edit`;
export const VIEWER_PATCH_PATH = `/:applicationSlug/:pageSlug(.*\-):pageId`;
export const APP_STATE_PATH = `/:appState`;

export const matchApiBasePath = match(API_EDITOR_BASE_PATH);
export const matchApiPath = match(API_EDITOR_ID_PATH);
export const matchDatasourcePath = match(
  `${BUILDER_PATH}${DATA_SOURCES_EDITOR_ID_PATH}`,
);
export const matchSAASGsheetsPath = match(
  `${BUILDER_PATH}${SAAS_GSHEET_EDITOR_ID_PATH}`,
);
export const matchQueryBasePath = match(QUERIES_EDITOR_BASE_PATH);
export const matchQueryPath = match(QUERIES_EDITOR_ID_PATH);
export const matchQueryBuilderPath = match(
  BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
);
export const matchBuilderPath = (
  pathName: string,
  options?: { end?: boolean },
) =>
  match(BUILDER_PATH, options)(pathName) ||
  match(BUILDER_PATH_DEPRECATED, options)(pathName) ||
  match(BUILDER_CUSTOM_PATH, options)(pathName) ||
  match(BUILDER_PATH + WIDGETS_EDITOR_ID_PATH, options)(pathName) ||
  match(BUILDER_CUSTOM_PATH + WIDGETS_EDITOR_ID_PATH, options)(pathName) ||
  match(BUILDER_PATH_DEPRECATED + WIDGETS_EDITOR_ID_PATH, options)(pathName);

export const matchJSObjectPath = match(JS_COLLECTION_ID_PATH);
export const matchViewerPath = (pathName: string) =>
  match(VIEWER_PATH)(pathName) ||
  match(VIEWER_PATH_DEPRECATED)(pathName) ||
  match(VIEWER_CUSTOM_PATH)(pathName);
export const matchViewerForkPath = (pathName: string) =>
  match(`${VIEWER_PATH}${VIEWER_FORK_PATH}`)(pathName) ||
  match(`${VIEWER_CUSTOM_PATH}${VIEWER_FORK_PATH}`)(pathName) ||
  match(`${VIEWER_PATH_DEPRECATED}${VIEWER_FORK_PATH}`)(pathName);
export const matchGeneratePagePath = (pathName: string) =>
  match(`${BUILDER_PATH}${GENERATE_TEMPLATE_FORM_PATH}`)(pathName) ||
  match(`${BUILDER_CUSTOM_PATH}${GENERATE_TEMPLATE_FORM_PATH}`)(pathName) ||
  match(`${BUILDER_PATH_DEPRECATED}${GENERATE_TEMPLATE_FORM_PATH}`)(pathName);

export const addBranchParam = (branch: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(GIT_BRANCH_QUERY_KEY, encodeURIComponent(branch));
  return url.toString().slice(url.origin.length);
};

export interface BuilderRouteParams {
  pageId: string;
  applicationId: string;
}

export interface AppViewerRouteParams {
  pageId: string;
  applicationId?: string;
}

export interface APIEditorRouteParams {
  pageId: string;
  apiId?: string;
}

export interface ProviderViewerRouteParams {
  pageId: string;
  providerId: string;
}

export interface QueryEditorRouteParams {
  pageId: string;
  queryId?: string;
  apiId?: string;
}

export interface JSEditorRouteParams {
  pageId: string;
  collectionId?: string;
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
export const PLACEHOLDER_PAGE_ID = "pageId";
export const PLACEHOLDER_PAGE_SLUG = "page";

export const SHOW_FILE_PICKER_KEY = "showPicker";
export const RESPONSE_STATUS = "response_status";
