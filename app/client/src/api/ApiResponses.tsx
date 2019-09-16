export type APIResponseCode = "SUCCESS" | "UNKNOWN";

export interface ResponseMeta {
  responseCode: APIResponseCode;
  message?: string;
}

export interface ApiResponse {
  responseMeta: ResponseMeta;
}
