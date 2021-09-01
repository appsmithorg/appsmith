const { match } = require("path-to-regexp");

export const BASE_URL = "/";
export const ORG_URL = "/org";
export const PAGE_NOT_FOUND_URL = "/404";
export const SERVER_ERROR_URL = "/500";
export const APPLICATIONS_URL = `/applications`;
export const BUILDER_URL = "/applications/:applicationId/pages/:pageId/edit";
export const USER_AUTH_URL = "/user";
export const PROFILE = "/profile";
export const USERS_URL = "/users";
export const VIEWER_URL_REGEX = /applications\/.*?\/pages\/.*/;
export const UNSUBSCRIBE_EMAIL_URL = "/unsubscribe/discussion/:threadId";
export const SETUP = "/setup/welcome";
export const BUILDER_CHECKLIST_URL = `${BUILDER_URL}/checklist`;

export type BuilderRouteParams = {
  applicationId: string;
  pageId: string;
};

export type AppViewerRouteParams = {
  applicationId?: string;
  pageId?: string;
};

export type APIEditorRouteParams = {
  applicationId: string;
  pageId: string;
  apiId?: string;
};

export type ProviderViewerRouteParams = {
  applicationId: string;
  pageId: string;
  providerId: string;
};

export type QueryEditorRouteParams = {
  applicationId: string;
  pageId: string;
  queryId: string;
};

export type JSEditorRouteParams = {
  applicationId: string;
  pageId: string;
  collectionId?: string;
};

export const BUILDER_BASE_URL = (applicationId = ":applicationId"): string =>
  `/applications/${applicationId}`;

export const BUILDER_PAGE_URL = (
  applicationId?: string,
  pageId?: string,
  params?: Record<string, string>,
): string => {
  if (!pageId) return APPLICATIONS_URL;
  const queryString = convertToQueryParams(params);
  return (
    `${BUILDER_BASE_URL(applicationId)}/pages/${pageId}/edit` + queryString
  );
};

export const API_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/api`;

export const PAGE_LIST_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/pages`;

export const DATA_SOURCES_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/datasource`;

export const DATA_SOURCES_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  datasourceId = ":datasourceId",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return `${DATA_SOURCES_EDITOR_URL(
    applicationId,
    pageId,
  )}/${datasourceId}${queryString}`;
};

export const QUERIES_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/queries`;

export const JS_COLLECTION_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/jsObjects`;

export const INTEGRATION_TABS = {
  ACTIVE: "ACTIVE",
  NEW: "NEW",
};

export const INTEGRATION_EDITOR_MODES = {
  AUTO: "auto",
  MOCK: "mock",
};
export const INTEGRATION_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  selectedTab = ":selectedTab",
  mode = "",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return `${BUILDER_PAGE_URL(
    applicationId,
    pageId,
  )}/datasources/${selectedTab}${
    mode ? "?mode=" + mode + "&" + queryString.replace("?", "") : queryString
  }`;
};

export const QUERIES_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  queryId = ":queryId",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return `${QUERIES_EDITOR_URL(
    applicationId,
    pageId,
  )}/${queryId}${queryString}`;
};

export const API_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  apiId = ":apiId",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return `${API_EDITOR_URL(applicationId, pageId)}/${apiId}${queryString}`;
};

export const API_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  return `${BUILDER_PAGE_URL(
    applicationId,
    pageId,
  )}/api?importTo=${selectedPageId}`;
};

export const JS_COLLECTION_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  collectionId = ":collectionId",
  params = {},
): string => {
  const queryParams = convertToQueryParams(params);
  return `${JS_COLLECTION_EDITOR_URL(
    applicationId,
    pageId,
  )}/${collectionId}${queryParams}`;
};

export const APP_VIEW_URL = `/applications/:applicationId`;

export const getApplicationViewerURL = (
  applicationId = ":applicationId",
): string => `/applications/${applicationId}`;

export const getApplicationViewerPageURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  params: Record<string, string> = {},
): string => {
  const url = `/applications/${applicationId}/pages/${pageId}`;
  const queryString = convertToQueryParams(params);
  return url + queryString;
};

export function convertToQueryParams(
  params: Record<string, string> = {},
): string {
  const paramKeys = Object.keys(params);
  const queryParams: string[] = [];
  if (paramKeys) {
    paramKeys.forEach((paramKey: string) => {
      const value = params[paramKey];
      if (paramKey && value) {
        queryParams.push(`${paramKey}=${value}`);
      }
    });
  }
  return queryParams.length ? "?" + queryParams.join("&") : "";
}

export const getCurlImportPageURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${API_EDITOR_URL(applicationId, pageId)}/curl/curl-import`;

export const getProviderTemplatesURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  providerId = ":providerId",
): string => `${API_EDITOR_URL(applicationId, pageId)}/provider/${providerId}`;

export const QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  return `${BUILDER_PAGE_URL(
    applicationId,
    pageId,
  )}/queries?importTo=${selectedPageId}`;
};

export const GEN_TEMPLATE_URL = "/generate-page";
export const GEN_TEMPLATE_FORM_ROUTE = "/form";

export const getGenerateTemplateURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}${GEN_TEMPLATE_URL}`;

export const getGenerateTemplateFormURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  `${BUILDER_PAGE_URL(
    applicationId,
    pageId,
  )}${GEN_TEMPLATE_URL}${GEN_TEMPLATE_FORM_ROUTE}`;

export const getOnboardingCheckListUrl = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/checklist`;

export const FORGOT_PASSWORD_URL = `${USER_AUTH_URL}/forgotPassword`;
export const RESET_PASSWORD_URL = `${USER_AUTH_URL}/resetPassword`;
export const BASE_SIGNUP_URL = `/signup`;
export const SIGN_UP_URL = `${USER_AUTH_URL}/signup`;
export const BASE_LOGIN_URL = `/login`;
export const AUTH_LOGIN_URL = `${USER_AUTH_URL}/login`;
export const SIGNUP_SUCCESS_URL = `/signup-success`;

export const ORG_INVITE_USERS_PAGE_URL = `${ORG_URL}/invite`;
export const ORG_SETTINGS_PAGE_URL = `${ORG_URL}/settings`;

export const matchApiPath = match(API_EDITOR_ID_URL());
export const matchDatasourcePath = match(DATA_SOURCES_EDITOR_ID_URL());
export const matchQueryPath = match(QUERIES_EDITOR_ID_URL());
export const matchBuilderPath = match(BUILDER_URL);
export const matchJSObjectPath = match(JS_COLLECTION_ID_URL());

export const matchViewerPath = match(getApplicationViewerPageURL());

export const BUILDER_URL_REGEX = /\/applications\/(.[^\/]*)\/pages\/(.[^\/]*)\//;
export const extractAppIdAndPageIdFromUrl = (url = "") => {
  const matched = url.match(BUILDER_URL_REGEX);
  if (matched) {
    return {
      applicationId: matched[1],
      pageId: matched[2],
    };
  }

  return {
    applicationId: "",
    pageId: "",
  };
};

export const SETTINGS_URL = "/settings";
export const SETTINGS_CATEGORY_DEFAULT_URL = "/settings/general";
export const SETTINGS_CATEGORY_URL = "/settings/:category";
export function getSettingsCategoryUrl(category: string) {
  return `${SETTINGS_URL}/${category}`;
}
