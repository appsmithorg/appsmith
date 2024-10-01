import type { AxiosError } from "axios";
import {
  ERROR_CODES,
  TIMEOUT_ERROR_REGEX,
  AXIOS_CONNECTION_ABORTED_CODE,
} from "ee/constants/ApiConstants";
import { createMessage, SERVER_API_TIMEOUT_ERROR } from "ee/constants/messages";

export const handleTimeoutError = async (error: AxiosError) => {
  if (
    error.code === AXIOS_CONNECTION_ABORTED_CODE &&
    error.message?.match(TIMEOUT_ERROR_REGEX)
  ) {
    return Promise.reject({
      ...error,
      message: createMessage(SERVER_API_TIMEOUT_ERROR),
      code: ERROR_CODES.REQUEST_TIMEOUT,
    });
  }

  return null;
};
