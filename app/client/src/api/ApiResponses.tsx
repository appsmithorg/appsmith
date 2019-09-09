export type ApiErrorCodes = "INVALID_REQUEST" | "UNKNOWN";

export interface ResponseMeta {
  errorCode?: ApiErrorCodes;
}

export interface ApiResponse {
  responseMeta: ResponseMeta;
}
