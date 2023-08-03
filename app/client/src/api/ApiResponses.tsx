export type APIResponseError = {
  code: string | number;
  message: string;
};

export type ResponseMeta = {
  status: number;
  success: boolean;
  error?: APIResponseError;
};

export type ApiResponse<T = unknown> = {
  responseMeta: ResponseMeta;
  data: T;
  code?: string;
};
