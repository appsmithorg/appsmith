export const REQUEST_TIMEOUT_MS = 20000;
export const DEFAULT_ACTION_TIMEOUT = 10000;
export const DEFAULT_EXECUTE_ACTION_TIMEOUT_MS = 15000;
export const DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS = 30000;
export const DEFAULT_APPSMITH_AI_QUERY_TIMEOUT_MS = 60000;
export const FILE_UPLOAD_TRIGGER_TIMEOUT_MS = 60000;

export enum API_STATUS_CODES {
  REQUEST_NOT_AUTHORISED = 401,
  RESOURCE_NOT_FOUND = 404,
  SERVER_ERROR = 502,
  SERVER_UNAVAILABLE = 503,
  REQUEST_FORBIDDEN = 403,
}

export const SERVER_ERROR_CODES = {
  INCORRECT_BINDING_LIST_OF_WIDGET: ["AE-JSN-4001", "AE-APP-4022"],
  RESOURCE_NOT_FOUND: [
    "AE-ACL-4004",
    "AE-BAD-4000",
    "AE-APP-4028",
    "AE-APP-4013",
  ],
  UNABLE_TO_FIND_PAGE: ["AE-APP-4027", "AE-USR-4004"],
};

export enum ERROR_CODES {
  PAGE_NOT_FOUND = "PAGE_NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",
  REQUEST_NOT_AUTHORISED = "REQUEST_NOT_AUTHORIZED",
  REQUEST_TIMEOUT = "REQUEST_TIMEOUT",
  FAILED_TO_CORRECT_BINDING = "FAILED_TO_CORRECT_BINDING",
  REQUEST_FORBIDDEN = "REQUEST_FORBIDDEN",
  CYPRESS_DEBUG = "CYPRESS_DEBUG",
}

export const OAuthURL = "/oauth2/authorization";
export const GoogleOAuthURL = `${OAuthURL}/google`;
export const GithubOAuthURL = `${OAuthURL}/github`;

export const LOGIN_SUBMIT_PATH = "login";
export const SIGNUP_SUBMIT_PATH = "users";
export const SUPER_USER_SUBMIT_PATH = `${SIGNUP_SUBMIT_PATH}/super`;
export const EMAIL_VERIFICATION_PATH = `users/verifyEmailVerificationToken`;

export const getExportAppAPIRoute = (
  applicationId: string,
  branchName: string | null = null,
) => {
  let exportUrl = `/api/v1/applications/export/${applicationId}`;

  if (branchName) {
    exportUrl += `?branchName=${branchName}`;
  }

  return exportUrl;
};

export const getSnapShotAPIRoute = (applicationId: string) =>
  `/v1/applications/snapshot/${applicationId}`;
