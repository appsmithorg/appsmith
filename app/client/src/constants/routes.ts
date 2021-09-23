import { APP_MODE } from "entities/App";

const { compile, match } = require("path-to-regexp");

export const BASE_URL = "/";
export const ORG_URL = "/org";
export const PAGE_NOT_FOUND_URL = "/404";
export const SERVER_ERROR_URL = "/500";
export const APPLICATIONS_URL = `/applications`;

export const BRANCH_PATH_PREFIX = `/(branch)?/:branchName(.*)?`;
export const BUILDER_URL = `${BRANCH_PATH_PREFIX}/applications/:defaultApplicationId/(pages)?/:pageId?/edit`;
export const VIEWER_URL = `${BRANCH_PATH_PREFIX}/applications/:defaultApplicationId/pages/:pageId`;
export const USER_AUTH_URL = "/user";
export const PROFILE = "/profile";
export const USERS_URL = "/users";
export const UNSUBSCRIBE_EMAIL_URL = "/unsubscribe/discussion/:threadId";
export const SETUP = "/setup/welcome";
export const BUILDER_CHECKLIST_URL = `${BUILDER_URL}/checklist`;

export const INTEGRATION_EDITOR_PATH = `${BUILDER_URL}/datasources/:selectedTab`;
export const API_EDITOR_ID_PATH = `${BUILDER_URL}/api/:apiId`;
export const QUERIES_EDITOR_ID_PATH = `${BUILDER_URL}/queries/:queryId`;
export const JS_COLLECTION_EDITOR_PATH = `${BUILDER_URL}/jsObjects`;
export const JS_COLLECTION_ID_PATH = `${JS_COLLECTION_EDITOR_PATH}/:collectionId`;
export const CURL_IMPORT_PAGE_PATH = `${BUILDER_URL}/api/curl/curl-import`;
export const PAGE_LIST_EDITOR_PATH = `${BUILDER_URL}/pages`;
export const DATA_SOURCES_EDITOR_ID_PATH = `${BUILDER_URL}/datasource/:datasourceId`;
export const PROVIDER_TEMPLATE_PATH = `${BUILDER_URL}/provider/:providerId`;

export const GEN_TEMPLATE_URL = "/generate-page";
export const GENERATE_TEMPLATE_PATH = `${BUILDER_URL}${GEN_TEMPLATE_URL}`;
export const GEN_TEMPLATE_FORM_ROUTE = "/form";
export const GENERATE_TEMPLATE_FORM_PATH = `${GENERATE_TEMPLATE_PATH}${GEN_TEMPLATE_FORM_ROUTE}`;

export const compileBuilderUrl = compile(BUILDER_URL);

export const addOrReplaceBranch = (branchName: string, currentPath: string) => {
  const regEx = /(.*)\/applications/;
  return currentPath.replace(regEx, `/branch/${branchName}/applications`);
};

// eslint-disable-next-line
export const getDefaultPathForBranch = (params: any, mode?: APP_MODE) => {
  return `/branch/${params.branchName}/applications/${params.applicationId}/edit`;
};

// for extracting branchName from the pathname
const branchNamePath = `${BRANCH_PATH_PREFIX}/applications/(.*)`;
export const matchBranchName = match(branchNamePath);
export const extractBranchNameFromPath = () => {
  const pathname = window.location.pathname;
  const matchResult = matchBranchName(pathname);
  return matchResult?.params?.branchName;
};

export const addBranchPath = (path: string, branchName?: string) => {
  const branchNameFromPath = extractBranchNameFromPath();
  const calcBranchName = branchName || branchNameFromPath;
  const includeSeparator = !path.startsWith("/");
  const separator = includeSeparator ? "/" : "";
  return !calcBranchName
    ? path
    : `/branch/${calcBranchName}${separator}${path}`;
};

export type BuilderRouteParams = {
  defaultApplicationId: string;
  pageId: string;
  branchName?: string;
};

export type AppViewerRouteParams = {
  defaultApplicationId: string;
  pageId?: string;
};

export type APIEditorRouteParams = {
  defaultApplicationId: string;
  pageId: string;
  apiId?: string;
  branchName?: string;
};

export type ProviderViewerRouteParams = {
  defaultApplicationId: string;
  pageId: string;
  providerId: string;
  branchName?: string;
};

export type QueryEditorRouteParams = {
  defaultApplicationId: string;
  pageId: string;
  queryId: string;
  branchName?: string;
};

export type JSEditorRouteParams = {
  defaultApplicationId: string;
  pageId: string;
  collectionId?: string;
  branchName?: string;
};

export const BUILDER_BASE_URL = (
  applicationId = ":defaultApplicationId",
): string => `/applications/${applicationId}`;

export const BUILDER_PAGE_URL = (
  applicationId?: string,
  pageId?: string,
  params?: Record<string, string>,
  branchName?: string,
): string => {
  if (!pageId) return APPLICATIONS_URL;
  const queryString = convertToQueryParams(params);
  return addBranchPath(
    `${BUILDER_BASE_URL(applicationId)}/pages/${pageId}/edit` + queryString,
    branchName,
  );
};

export const API_EDITOR_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string => addBranchPath(`${BUILDER_PAGE_URL(applicationId, pageId)}/api`);

export const PAGE_LIST_EDITOR_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string => addBranchPath(`${BUILDER_PAGE_URL(applicationId, pageId)}/pages`);

export const DATA_SOURCES_EDITOR_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  addBranchPath(`${BUILDER_PAGE_URL(applicationId, pageId)}/datasource`);

export const DATA_SOURCES_EDITOR_ID_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  datasourceId = ":datasourceId",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return addBranchPath(
    `${DATA_SOURCES_EDITOR_URL(
      applicationId,
      pageId,
    )}/${datasourceId}${queryString}`,
  );
};

export const QUERIES_EDITOR_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  addBranchPath(`${BUILDER_PAGE_URL(applicationId, pageId)}/queries`);

export const JS_COLLECTION_EDITOR_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  addBranchPath(`${BUILDER_PAGE_URL(applicationId, pageId)}/jsObjects`);

export const INTEGRATION_TABS = {
  ACTIVE: "ACTIVE",
  NEW: "NEW",
};

export const INTEGRATION_EDITOR_MODES = {
  AUTO: "auto",
  MOCK: "mock",
};
export const INTEGRATION_EDITOR_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  selectedTab = ":selectedTab",
  mode = "",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return addBranchPath(
    `${BUILDER_PAGE_URL(applicationId, pageId)}/datasources/${selectedTab}${
      mode ? "?mode=" + mode + "&" + queryString.replace("?", "") : queryString
    }`,
  );
};

export const QUERIES_EDITOR_ID_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  queryId = ":queryId",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return addBranchPath(
    `${QUERIES_EDITOR_URL(applicationId, pageId)}/${queryId}${queryString}`,
  );
};

export const API_EDITOR_ID_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  apiId = ":apiId",
  params = {},
): string => {
  const queryString = convertToQueryParams(params);
  return addBranchPath(
    `${API_EDITOR_URL(applicationId, pageId)}/${apiId}${queryString}`,
  );
};

export const API_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  return addBranchPath(
    `${BUILDER_PAGE_URL(applicationId, pageId)}/api?importTo=${selectedPageId}`,
  );
};

export const JS_COLLECTION_ID_URL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  collectionId = ":collectionId",
  params = {},
): string => {
  const queryParams = convertToQueryParams(params);
  return addBranchPath(
    `${JS_COLLECTION_EDITOR_URL(
      applicationId,
      pageId,
    )}/${collectionId}${queryParams}`,
  );
};

export const APP_VIEW_URL = `/applications/:defaultApplicationId`;

export const getApplicationViewerPageURL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  params: Record<string, string> = {},
): string => {
  const url = addBranchPath(`/applications/${applicationId}/pages/${pageId}`);
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
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  addBranchPath(`${API_EDITOR_URL(applicationId, pageId)}/curl/curl-import`);

export const getProviderTemplatesURL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  providerId = ":providerId",
): string =>
  addBranchPath(
    `${API_EDITOR_URL(applicationId, pageId)}/provider/${providerId}`,
  );

export const QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  return addBranchPath(
    `${BUILDER_PAGE_URL(
      applicationId,
      pageId,
    )}/queries?importTo=${selectedPageId}`,
  );
};

export const getGenerateTemplateURL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  addBranchPath(
    `${BUILDER_PAGE_URL(applicationId, pageId)}${GEN_TEMPLATE_URL}`,
  );

export const getGenerateTemplateFormURL = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  addBranchPath(
    `${BUILDER_PAGE_URL(
      applicationId,
      pageId,
    )}${GEN_TEMPLATE_URL}${GEN_TEMPLATE_FORM_ROUTE}`,
  );

export const getOnboardingCheckListUrl = (
  applicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  addBranchPath(`${BUILDER_PAGE_URL(applicationId, pageId)}/checklist`);

export const FORGOT_PASSWORD_URL = `${USER_AUTH_URL}/forgotPassword`;
export const RESET_PASSWORD_URL = `${USER_AUTH_URL}/resetPassword`;
export const BASE_SIGNUP_URL = `/signup`;
export const SIGN_UP_URL = `${USER_AUTH_URL}/signup`;
export const BASE_LOGIN_URL = `/login`;
export const AUTH_LOGIN_URL = `${USER_AUTH_URL}/login`;
export const SIGNUP_SUCCESS_URL = `/signup-success`;

export const ORG_INVITE_USERS_PAGE_URL = `${ORG_URL}/invite`;
export const ORG_SETTINGS_PAGE_URL = `${ORG_URL}/settings`;

export const matchApiPath = match(API_EDITOR_ID_PATH);
export const matchDatasourcePath = match(DATA_SOURCES_EDITOR_ID_PATH);
export const matchQueryPath = match(QUERIES_EDITOR_ID_PATH);
export const matchBuilderPath = match(BUILDER_URL);
export const matchJSObjectPath = match(JS_COLLECTION_ID_PATH);

export const matchViewerPath = match(VIEWER_URL);

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
