import { MenuIcons } from "../icons/MenuIcons";

export const BASE_URL = "/";
export const LOGIN_URL = "/login";
export const BUILDER_URL = "/builder";
export const API_EDITOR_URL = `${BUILDER_URL}/api`;
export const API_EDITOR_ID_URL = (id = ":id") => `${API_EDITOR_URL}/${id}`;
export const APP_VIEW_URL = `/view/pages/:pageId`;
export const APPLICATIONS_URL = `/applications`;

// TODO(abhinav): We probably need a utils/routes file for such functions.
export const getApplicationBuilderURL = (applicationId: string) =>
  `${BUILDER_URL}/${applicationId}`;

export const getApplicationViewerURL = (
  applicationId: string,
  pageId?: string,
) => `/view/application/${applicationId}/pages/${pageId}`;

export const EDITOR_ROUTES = [
  {
    icon: MenuIcons.WIDGETS_ICON,
    path: BUILDER_URL,
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
