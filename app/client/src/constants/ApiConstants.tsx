export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded";

export const PROD_BASE_URL = "https://mobtools.com/api/";
export const MOCK_BASE_URL =
  "https://f78ff9dd-2c08-45f1-9bf9-8c670a1bb696.mock.pstmn.io";
export const STAGE_BASE_URL = "https://appsmith-test.herokuapp.com/api/";
export const BASE_URL = STAGE_BASE_URL;
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

export const getEditorConfigs = () => {
  if (process.env.NODE_ENV === "development") {
    return {
      currentPageId: "5d807e7f795dc6000482bc78",
      currentLayoutId: "5d807e7f795dc6000482bc77",
    };
  } else {
    return {
      currentPageId: "5d807e76795dc6000482bc76",
      currentLayoutId: "5d807e76795dc6000482bc75",
    };
  }
};

console.log("here", process.env.NODE_ENV);
