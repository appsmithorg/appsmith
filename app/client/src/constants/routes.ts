import { MenuIcons } from "icons/MenuIcons";
import { FeatureFlagEnum } from "utils/featureFlags";
export const BASE_URL = "/";
export const ORG_URL = "/org";
export const APPLICATIONS_URL = `/applications`;
export const BUILDER_URL = "/applications/:applicationId/pages/:pageId/edit";
export const USER_AUTH_URL = "/user";
export const USERS_URL = "/users";

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

export const BUILDER_BASE_URL = (applicationId = ":applicationId"): string =>
  `/applications/${applicationId}`;

export const BUILDER_PAGE_URL = (
  applicationId?: string,
  pageId?: string,
  params?: Record<string, string>,
): string => {
  if (!pageId) return APPLICATIONS_URL;
  const queryParams = convertToQueryParams(params);
  return (
    `${BUILDER_BASE_URL(applicationId)}/pages/${pageId}/edit` + queryParams
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
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/datasources`;

export const DATA_SOURCES_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  datasourceId = ":datasourceId",
): string =>
  `${DATA_SOURCES_EDITOR_URL(applicationId, pageId)}/${datasourceId}`;

export const API_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  apiId = ":apiId",
): string => `${API_EDITOR_URL(applicationId, pageId)}/${apiId}`;

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
  const queryParams = convertToQueryParams(params);
  return url + queryParams;
};

function convertToQueryParams(params: Record<string, string> = {}): string {
  const paramKeys = Object.keys(params);
  let queryParams = "";
  if (paramKeys) {
    paramKeys.forEach((paramKey: string, index: number) => {
      const value = params[paramKey];
      if (paramKey && value) {
        queryParams = queryParams + `&${paramKey}=${value}`;
      }
    });
  }
  return queryParams ? "?" + queryParams : "";
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

export const EDITOR_ROUTES = [
  {
    icon: MenuIcons.WIDGETS_ICON,
    path: BUILDER_PAGE_URL,
    title: "Widgets",
    className: "t--nav-link-widgets-editor",
    exact: true,
  },
  {
    icon: MenuIcons.APIS_ICON,
    path: API_EDITOR_URL,
    className: "t--nav-link-api-editor",
    title: "APIs",
    exact: false,
  },
  {
    icon: MenuIcons.DATASOURCES_ICON,
    className: "t--nav-link-datasource-editor",
    path: DATA_SOURCES_EDITOR_URL,
    title: "Datasources",
    exact: false,
    flag: FeatureFlagEnum.DatasourcePane,
  },
  {
    icon: MenuIcons.PAGES_ICON,
    path: PAGE_LIST_EDITOR_URL,
    className: "t--nav-link-manage-pages",
    title: "Pages",
    exact: true,
  },
];

export const FORGOT_PASSWORD_URL = `${USER_AUTH_URL}/forgotPassword`;
export const RESET_PASSWORD_URL = `${USER_AUTH_URL}/resetPassword`;
export const BASE_SIGNUP_URL = `/signup`;
export const SIGN_UP_URL = `${USER_AUTH_URL}/signup`;
export const BASE_LOGIN_URL = `/login`;
export const AUTH_LOGIN_URL = `${USER_AUTH_URL}/login`;

export const ORG_INVITE_USERS_PAGE_URL = `${ORG_URL}/invite`;
export const ORG_SETTINGS_PAGE_URL = `${ORG_URL}/settings`;
