// eslint-disable-next-line @typescript-eslint/no-var-requires
const { match } = require("path-to-regexp");

export const BASE_URL = "/";
export const WORKSPACE_URL = "/workspace";
export const PAGE_NOT_FOUND_URL = "/404";
export const SERVER_ERROR_URL = "/500";
export const APPLICATIONS_URL = `/applications`;
export const LICENSE_CHECK_PATH = "/license";
export const MIGRATIONS_URL = "/migrations";

export const TEMPLATES_PATH = "/templates";
export const TEMPLATES_ID_PATH = "/templates/:templateId";

export const USER_AUTH_URL = "/user";
export const PROFILE = "/profile";
export const GIT_PROFILE_ROUTE = `${PROFILE}/git`;
export const USERS_URL = "/users";
export const SETUP = "/setup/welcome";
export const FORGOT_PASSWORD_URL = `${USER_AUTH_URL}/forgotPassword`;
export const RESET_PASSWORD_URL = `${USER_AUTH_URL}/resetPassword`;
export const BASE_SIGNUP_URL = `/signup`;
export const SIGN_UP_URL = `${USER_AUTH_URL}/signup`;
export const BASE_LOGIN_URL = `/login`;
export const AUTH_LOGIN_URL = `${USER_AUTH_URL}/login`;
export const SIGNUP_SUCCESS_URL = `/signup-success`;
export const WORKSPACE_INVITE_USERS_PAGE_URL = `${WORKSPACE_URL}/invite`;
export const WORKSPACE_SETTINGS_PAGE_URL = `${WORKSPACE_URL}/settings`;
export const WORKSPACE_SETTINGS_GENERAL_PAGE_URL = `${WORKSPACE_URL}/settings/general`;
export const WORKSPACE_SETTINGS_MEMBERS_PAGE_URL = `${WORKSPACE_URL}/settings/members`;
export const WORKSPACE_SETTINGS_LICENSE_PAGE_URL = `/settings/license`;
export const ORG_LOGIN_PATH = "/org";

export const matchApplicationPath = match(APPLICATIONS_URL);
export const matchTemplatesPath = match(TEMPLATES_PATH);
export const matchTemplatesIdPath = match(TEMPLATES_ID_PATH);
