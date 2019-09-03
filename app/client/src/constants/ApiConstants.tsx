import { ApiHeaders } from "../api/ApiRequests";

export type DataType = "json" | "xml"
export type ContentType = "application/json" | "application/x-www-form-urlencoded"
export type EncodingType = "gzip"

export const PROD_BASE_URL = "https://mobtools.com/api/"
export const MOCK_BASE_URL = "https://f78ff9dd-2c08-45f1-9bf9-8c670a1bb696.mock.pstmn.io"
export const STAGE_BASE_URL = "https://14157cb0-190f-4082-a791-886a8df05930.mock.pstmn.io"
export const BASE_URL = MOCK_BASE_URL
export const REQUEST_TIMEOUT_MS = 2000
export const REQUEST_HEADERS: ApiHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  dataType: "json",
}

export interface APIException {
  error: number;
  message: string;
}
