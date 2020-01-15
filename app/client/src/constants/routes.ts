import { MenuIcons } from "icons/MenuIcons";
export const BASE_URL = "/";
export const ORG_URL = "/org";
export const APPLICATIONS_URL = `/applications`;
export const BUILDER_URL = "/applications/:applicationId/pages/:pageId/edit";
export const USER_AUTH_URL = "/user";

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

export const BUILDER_BASE_URL = (applicationId = ":applicationId"): string =>
  `/applications/${applicationId}`;

export const BUILDER_PAGE_URL = (
  applicationId?: string,
  pageId?: string,
): string => {
  if (!pageId) return APPLICATIONS_URL;
  return `${BUILDER_BASE_URL(applicationId)}/pages/${pageId}/edit`;
};

export const API_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `${BUILDER_PAGE_URL(applicationId, pageId)}/api`;

export const API_EDITOR_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  apiId = ":apiId",
): string => `${API_EDITOR_URL(applicationId, pageId)}/${apiId}`;

export const APP_VIEW_URL = `/applications/:applicationId`;

export const getApplicationViewerURL = (
  applicationId = ":applicationId",
): string => `/applications/${applicationId}`;

export const getApplicationViewerPageURL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
): string => `/applications/${applicationId}/pages/${pageId}`;

export const EDITOR_ROUTES = [
  {
    icon: MenuIcons.WIDGETS_ICON,
    path: BUILDER_PAGE_URL,
    title: "Widgets",
    exact: true,
  },
  {
    icon: MenuIcons.APIS_ICON,
    path: API_EDITOR_URL,
    title: "APIs",
    exact: false,
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
