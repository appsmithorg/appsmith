import { APP_MODE } from "entities/App";

const { compile, match } = require("path-to-regexp");

export const BASE_URL = "/";
export const ORG_URL = "/org";
export const PAGE_NOT_FOUND_URL = "/404";
export const SERVER_ERROR_URL = "/500";
export const APPLICATIONS_URL = `/applications`;

export const USER_AUTH_URL = "/user";
export const PROFILE = "/profile";
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

export const BUILDER_URL = `/:pageId/edit`;
export const VIEWER_URL = `/:pageId`;

// export const BUILDER_URL = `/(applications)?/:defaultApplicationId?/(pages)?/:pageId/edit`;
// export const VIEWER_URL = `/(applications)?/:defaultApplicationId?/(pages)?/:pageId`;

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

export const GEN_TEMPLATE_URL = "/generate-page";
export const GENERATE_TEMPLATE_PATH = `${BUILDER_URL}${GEN_TEMPLATE_URL}`;
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

export const addOrReplaceBranch = (branchName: string, currentPath: string) => {
  const regEx = /(.*)\/applications/;
  return currentPath.replace(regEx, `/branch/${branchName}/applications`);
};

// eslint-disable-next-line
export const getDefaultPathForBranch = (params: any, mode?: APP_MODE) => {
  return `/branch/${params.branchName}/applications/${params.applicationId}/edit`;
};

// for extracting branchName from the pathname
const branchNamePath = "";
export const matchBranchName = match(branchNamePath);
export const extractBranchNameFromPath = () => {
  const pathname = window.location.pathname;
  const matchResult = matchBranchName(pathname);
  return matchResult?.params?.branchName;
};

export type BuilderRouteParams = {
  pageId: string;
  defaultApplicationId: string;
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

export const BUILDER_BASE_URL = (
  applicationId = ":defaultApplicationId",
): string => `/applications/${applicationId}`;

export const APP_ID_QUERY_KEY = "applicationId";
export const GIT_BRANCH_QUERY_KEY = "branch";

export const BUILDER_PAGE_URL = (props: {
  branch?: string;
  defaultApplicationId?: string;
  hash?: string;
  pageId?: string; // TODO make pageId mandatory
  params?: Record<string, string>;
  suffix?: string;
}): string => {
  const {
    defaultApplicationId,
    hash = "",
    pageId,
    params = {},
    suffix,
  } = props;
  const modifiedParams = { ...params };

  // todo (rishabh s) check when this is applicable
  if (!pageId) return APPLICATIONS_URL;

  // todo (rishabh s) could inject branch param here
  if (defaultApplicationId) {
    modifiedParams[APP_ID_QUERY_KEY] = defaultApplicationId;
  }

  const queryString = convertToQueryParams(modifiedParams);
  const suffixPath = suffix ? `/${suffix}` : "";
  const hashPath = hash ? `#${hash}` : "";
  return `/${pageId}/edit${suffixPath}${hashPath}${queryString}`;
};

export const API_EDITOR_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "api",
  });

export const PAGE_LIST_EDITOR_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "pages",
  });

export const DATA_SOURCES_EDITOR_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "datasource",
  });

export const DATA_SOURCES_EDITOR_ID_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  datasourceId = ":datasourceId",
  params = {},
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: `datasource/${datasourceId}`,
    params,
  });

export const QUERIES_EDITOR_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "queries",
  });

export const JS_COLLECTION_EDITOR_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
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
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  selectedTab = ":selectedTab",
  mode = "",
  params = {},
): string => {
  if (mode) {
    (params as any).mode = mode;
  }
  return BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: `datasources/${selectedTab}`,
    params,
  });
};

export const QUERIES_EDITOR_ID_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  queryId = ":queryId",
  params = {},
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: `queries/${queryId}`,
    params,
  });

export const API_EDITOR_ID_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  apiId = ":apiId",
  params = {},
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: `api/${apiId}`,
    params,
  });

export const API_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  return BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "api",
    params: {
      importTo: selectedPageId,
    },
  });
};

export const JS_COLLECTION_ID_URL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  collectionId = ":collectionId",
  params = {},
): string => {
  return BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: `jsObjects/${collectionId}`,
    params,
  });
};

export const getApplicationViewerPageURL = (props: {
  defaultApplicationId?: string;
  pageId?: string; // TODO make pageId this mandatory
  params?: Record<string, string>;
  suffix?: string;
}): string => {
  const {
    defaultApplicationId = ":defaultApplicationId",
    pageId = ":pageId",
    params = {},
    suffix,
  } = props;

  const url = `/${pageId}`;
  const modifiedParams = {
    ...params,
    [APP_ID_QUERY_KEY]: defaultApplicationId,
  };
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
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "api/curl/curl-import",
  });

export const getProviderTemplatesURL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  providerId = ":providerId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: `api/provider/${providerId}`,
  });

export const QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
  selectedPageId = ":importTo",
): string => {
  const params = {
    importTo: selectedPageId,
  };
  return BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "queries",
    params,
  });
};

export const getGenerateTemplateURL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: GEN_TEMPLATE_URL,
  });

export const getGenerateTemplateFormURL = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: `${GEN_TEMPLATE_URL}${GEN_TEMPLATE_FORM_ROUTE}`,
  });

export const getOnboardingCheckListUrl = (
  defaultApplicationId = ":defaultApplicationId",
  pageId = ":pageId",
): string =>
  BUILDER_PAGE_URL({
    defaultApplicationId,
    pageId,
    suffix: "checklist",
  });

export const pathsForDefaultHeader = [
  ORG_URL,
  PROFILE,
  APPLICATIONS_URL,
  SIGNUP_SUCCESS_URL,
  PAGE_NOT_FOUND_URL,
  SERVER_ERROR_URL,
];
