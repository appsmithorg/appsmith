export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded";

export const STAGE_BASE_URL = "https://release-api.appsmith.com";
export const PROD_BASE_URL = "https://api.appsmith.com";

export const REQUEST_TIMEOUT_MS = 10000;

export const API_REQUEST_HEADERS: APIHeaders = {
  "Content-Type": "application/json",
};
export const FORM_REQUEST_HEADERS: APIHeaders = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export const OAuthURL = "/oauth2/authorization";
export const GoogleOAuthURL = `${OAuthURL}/google`;
export const GithubOAuthURL = `${OAuthURL}/github`;

export const LOGIN_SUBMIT_PATH = "/login";

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
