export interface APIResponseError {
  code: string;
  message: string;
  errorType?: string;
}

export interface ResponseMeta {
  status: number;
  success: boolean;
  error?: APIResponseError;
}

export interface ApiResponse<T = unknown> {
  responseMeta: ResponseMeta;
  data: T;
  code?: string;
}
