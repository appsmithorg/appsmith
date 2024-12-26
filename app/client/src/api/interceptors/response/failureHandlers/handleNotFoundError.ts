import {
  API_STATUS_CODES,
  ERROR_CODES,
  SERVER_ERROR_CODES,
} from "ee/constants/ApiConstants";
import type { AxiosError } from "axios";
import type { ApiResponse } from "api/types";
import { is404orAuthPath } from "api/helpers";
import { captureException } from "instrumentation";

export async function handleNotFoundError(error: AxiosError<ApiResponse>) {
  if (is404orAuthPath()) return null;

  const errorData =
    error?.response?.data.responseMeta ?? ({} as ApiResponse["responseMeta"]);

  if (
    errorData.status === API_STATUS_CODES.RESOURCE_NOT_FOUND &&
    errorData.error?.code &&
    (SERVER_ERROR_CODES.RESOURCE_NOT_FOUND.includes(errorData.error?.code) ||
      SERVER_ERROR_CODES.UNABLE_TO_FIND_PAGE.includes(errorData?.error?.code))
  ) {
    captureException(error);

    return Promise.reject({
      ...error,
      code: ERROR_CODES.PAGE_NOT_FOUND,
      message: "Resource Not Found",
      show: false,
    });
  }

  return null;
}
