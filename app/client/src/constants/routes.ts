const { compile, match } = require("path-to-regexp");

import { getQueryParamsObject } from "utils/helpers";

export const BASE_URL = "/";
export const ORG_URL = "/org";
export const PAGE_NOT_FOUND_URL = "/404";
export const SERVER_ERROR_URL = "/500";
export const APPLICATIONS_URL = `/applications`;

export const USER_AUTH_URL = "/user";
export const PROFILE = "/profile";

export const GIT_PROFILE_ROUTE = `${PROFILE}/git`;
export const USERS_URL = "/users";
export const UNSUBSCRIBE_EMAIL_URL = "/unsubscribe/discussion/:threadId";
export const SETUP = "/setup/welcome";

export const FORGOT_PASSWORD_URL = `${USER_AUTH_URL}/forgotPassword`;
export const RESET_PASSWORD_URL = `${USER_AUTH_URL}/resetPassword`;
export const BASE_SIGNUP_URL = `/signup`;
export const SIGN_UP_URL = `${USER_AUTH_URL}/signup`;
export const BASE_LOGIN_URL = `/login`;
export const AUTH_LOGIN_URL = `${USER_AUTH_URL}/login`;
export const SIGNUP_SUCCESS_URL = `/signup-success`;

export const ORG_INVITE_USERS_PAGE_URL = `${ORG_URL}/invite`;
export const ORG_SETTINGS_PAGE_URL = `${ORG_URL}/settings`;

export const BUILDER_URL = `/applications/:applicationId/(pages)?/:pageId?/edit`;
export const VIEWER_URL = `/applications/:applicationId/(pages)?/:pageId?`;

export const VIEWER_FORK_PATH = `${VIEWER_URL}/fork`;

export const INTEGRATION_EDITOR_PATH = `${BUILDER_URL}/datasources/:selectedTab`;
export const API_EDITOR_BASE_PATH = `${BUILDER_URL}/api`;
export const API_EDITOR_ID_PATH = `${API_EDITOR_BASE_PATH}/:apiId`;
export const QUERIES_EDITOR_BASE_PATH = `${BUILDER_URL}/queries`;
export const QUERIES_EDITOR_ID_PATH = `${QUERIES_EDITOR_BASE_PATH}/:queryId`;
export const JS_COLLECTION_EDITOR_PATH = `${BUILDER_URL}/jsObjects`;
export const JS_COLLECTION_ID_PATH = `${JS_COLLECTION_EDITOR_PATH}/:collectionId`;
export const CURL_IMPORT_PAGE_PATH = `${BUILDER_URL}/api/curl/curl-import`;
export const PAGE_LIST_EDITOR_PATH = `${BUILDER_URL}/pages`;
export const DATA_SOURCES_EDITOR_ID_PATH = `${BUILDER_URL}/datasource/:datasourceId`;
export const PROVIDER_TEMPLATE_PATH = `${BUILDER_URL}/provider/:providerId`;

export const GEN_TEMPLATE_URL = "generate-page";
export const GENERATE_TEMPLATE_PATH = `${BUILDER_URL}/${GEN_TEMPLATE_URL}`;
export const GEN_TEMPLATE_FORM_ROUTE = "/form";
export const GENERATE_TEMPLATE_FORM_PATH = `${GENERATE_TEMPLATE_PATH}${GEN_TEMPLATE_FORM_ROUTE}`;

export const BUILDER_CHECKLIST_URL = `${BUILDER_URL}/checklist`;

export const matchApiBasePath = match(API_EDITOR_BASE_PATH);
export const matchApiPath = match(API_EDITOR_ID_PATH);
export const matchDatasourcePath = match(DATA_SOURCES_EDITOR_ID_PATH);
export const matchQueryBasePath = match(QUERIES_EDITOR_BASE_PATH);
export const matchQueryPath = match(QUERIES_EDITOR_ID_PATH);
export const matchBuilderPath = match(BUILDER_URL);
export const matchJSObjectPath = match(JS_COLLECTION_ID_PATH);
export const matchViewerPath = match(VIEWER_URL);
export const matchViewerForkPath = match(VIEWER_FORK_PATH);

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

export const compileBuilderUrl = compile(BUILDER_URL);

export const addBranchParam = (branch: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(GIT_BRANCH_QUERY_KEY, encodeURIComponent(branch));
  return url.toString().slice(url.origin.length);
};

const fetchParamsToPersist = () => {
  const existingParams = getQueryParamsObject() || {};

  // not persisting the entire query currently, since that's the current behaviour
  const { branch, embed } = existingParams;
  let params = { branch, embed } as any;

  // test param to make sure a query param is present in the URL during dev and tests
  if ((window as any).Cypress || process.env?.NODE_ENV === "development") {
    params = { a: "b", ...params };
  }

  return params;
};

export type BuilderRouteParams = {
  pageId: string;
  applicationId: string;
};

export type AppViewerRouteParams = {
  pageId?: string;
};

export type APIEditorRouteParams = {
  pageId: string;
  apiId?: string;
};

export type ProviderViewerRouteParams = {
  pageId: string;
  providerId: string;
};

export type QueryEditorRouteParams = {
  pageId: string;
  queryId: string;
};

export type JSEditorRouteParams = {
  pageId: string;
  collectionId?: string;
};

export const BUILDER_BASE_URL = (applicationId = ":applicationId"): string =>
  `/applications/${applicationId}`;

export const GIT_BRANCH_QUERY_KEY = "branch";

export const BUILDER_PAGE_URL = (props: {
  branch?: string;
  applicationId?: string;
  hash?: string;
  pageId?: string; // TODO make pageId mandatory
  params?: Record<string, string>;
  suffix?: string;
}): string => {
  const { applicationId, hash = "", pageId, params = {}, suffix } = props;

  // todo (rishabh s) check when this is applicable
  if (!pageId) return APPLICATIONS_URL;

  const paramsToPersist = fetchParamsToPersist();
  const modifiedParams = { ...paramsToPersist, ...params };

  const queryString = convertToQueryParams(modifiedParams);
  const suffixPath = suffix ? `/${suffix}` : "";
  const hashPath = hash ? `#${hash}` : "";

  // hash fragment should be at the end of the href
  // ref: https://www.rfc-editor.org/rfc/rfc3986#section-4.1
  return `/applications/${applicationId}/pages/${pageId}/edit${suffixPath}${queryString}${hashPath}`;
};

export const API_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "api",
  });

export const PAGE_LIST_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "pages",
  });

export const DATA_SOURCES_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "datasource",
  });

export const DATA_SOURCES_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  datasourceId = ":datasourceId",
  params = {},
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: `datasource/${datasourceId}`,
    params,
  });

export const QUERIES_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "queries",
  });

export const JS_COLLECTION_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "jsObjects",
  });

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
  suffix = "",
): string => {
  if (mode) {
    (params as any).mode = mode;
  }
  const suffixPath = suffix ? `/${suffix}` : "";
  return BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: `datasources/${selectedTab}${suffixPath}`,
    params,
  });
};

export const QUERIES_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  queryId = ":queryId",
  params = {},
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: `queries/${queryId}`,
    params,
  });

export const API_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  apiId = ":apiId",
  params = {},
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: `api/${apiId}`,
    params,
  });

export const API_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  return BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "api",
    params: {
      importTo: selectedPageId,
    },
  });
};

export const JS_COLLECTION_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  collectionId = ":collectionId",
  params = {},
): string => {
  return BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: `jsObjects/${collectionId}`,
    params,
  });
};

export const getApplicationEditorPageURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  params: Record<string, string> = {},
): string => {
  const url = `/applications/${applicationId}/pages/${pageId}/edit`;
  const queryString = convertToQueryParams(params);
  return url + queryString;
};

export const getApplicationViewerPageURL = (props: {
  applicationId?: string;
  pageId?: string; // TODO make pageId this mandatory
  params?: Record<string, string>;
  suffix?: string;
}): string => {
  const {
    applicationId = ":applicationId",
    pageId = ":pageId",
    params = {},
    suffix,
  } = props;

  const url = `/applications/${applicationId}/pages/${pageId}`;

  const paramsToPersist = fetchParamsToPersist();
  const modifiedParams = { ...paramsToPersist, ...params };

  const queryString = convertToQueryParams(modifiedParams);
  const suffixPath = suffix ? `/${suffix}` : "";
  return url + suffixPath + queryString;
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
  params = {},
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "api/curl/curl-import",
    params,
  });

export const getProviderTemplatesURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  providerId = ":providerId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: `api/provider/${providerId}`,
  });

export const QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  const params = {
    importTo: selectedPageId,
  };
  return BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "queries",
    params,
  });
};

export const getGenerateTemplateURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: GEN_TEMPLATE_URL,
  });

export const getGenerateTemplateFormURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  params = {},
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: `${GEN_TEMPLATE_URL}${GEN_TEMPLATE_FORM_ROUTE}`,
    params,
  });

export const getOnboardingCheckListUrl = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    applicationId,
    pageId,
    suffix: "checklist",
  });

export const ADMIN_SETTINGS_URL = "/settings";
export const ADMIN_SETTINGS_CATEGORY_DEFAULT_URL = "/settings/general";
export const ADMIN_SETTINGS_CATEGORY_URL = "/settings/:category/:subCategory?";
export function getAdminSettingsCategoryUrl(
  category: string,
  subCategory?: string,
) {
  return `${ADMIN_SETTINGS_URL}/${category}${
    subCategory ? "/" + subCategory : ""
  }`;
}
