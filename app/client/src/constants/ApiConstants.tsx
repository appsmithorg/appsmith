export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded";

export const REQUEST_TIMEOUT_MS = 20000;
export const DEFAULT_ACTION_TIMEOUT = 10000;
export const DEFAULT_EXECUTE_ACTION_TIMEOUT_MS = 15000;
export const DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS = 30000;

export const API_REQUEST_HEADERS: APIHeaders = {
  "Content-Type": "application/json",
};

export const POSTMAN = "POSTMAN";
export const CURL = "CURL";
export const Swagger = "Swagger";

export const OAuthURL = "/oauth2/authorization";
export const GoogleOAuthURL = `${OAuthURL}/google`;
export const GithubOAuthURL = `${OAuthURL}/github`;

export const LOGIN_SUBMIT_PATH = "login";
export const SIGNUP_SUBMIT_PATH = "users";

export interface APIException {
  error: number;
  message: string;
}

export interface APIHeaders {
  "Content-Type": ContentType;
  Accept?: string;
}

export interface APIRequest {
  requestId?: string;
}
