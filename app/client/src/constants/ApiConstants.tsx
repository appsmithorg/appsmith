export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded";

export const STAGE_BASE_API_URL = "https://appsmith-test.herokuapp.com/api/";
export const PROD_BASE_API_URL = "https://api.appsmith.com/api/";

export const REQUEST_TIMEOUT_MS = 10000;
export const REQUEST_HEADERS: APIHeaders = {
  "Content-Type": "application/json",
};

export const AUTH_CREDENTIALS = {
  username: "api_user",
  password: "8uA@;&mB:cnvN~{#",
};

export interface APIException {
  error: number;
  message: string;
}

export interface APIHeaders {
  "Content-Type": ContentType;
}

export interface APIRequest {
  requestId?: string;
}
