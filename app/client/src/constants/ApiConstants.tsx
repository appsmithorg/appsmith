export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded";

export const REQUEST_TIMEOUT_MS = 10000;
export const EXECUTE_ACTION_TIMEOUT_MS = 15000;

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
