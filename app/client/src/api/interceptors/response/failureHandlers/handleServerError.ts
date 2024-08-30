import type { AxiosError } from "axios";
import { createMessage, ERROR_500 } from "ee/constants/messages";
import { API_STATUS_CODES, ERROR_CODES } from "ee/constants/ApiConstants";

export const handleServerError = async (error: AxiosError) => {
  if (error.response?.status === API_STATUS_CODES.SERVER_ERROR) {
    return Promise.reject({
      ...error,
      code: ERROR_CODES.SERVER_ERROR,
      message: createMessage(ERROR_500),
    });
  }

  return null;
};
