import type { AxiosError, AxiosResponse } from "axios";

export interface ApiResponseError {
  code: string;
  message: string;
}

export interface ApiResponseMeta {
  status: number;
  success: boolean;
  error?: ApiResponseError;
}

export interface ApiResponse<T = unknown> {
  responseMeta: ApiResponseMeta;
  data: T;
  code?: string;
}

export type AxiosResponseData<T> = AxiosResponse<ApiResponse<T>>["data"];

export type ErrorHandler = (
  error: AxiosError<ApiResponse>,
) => Promise<unknown | null>;
