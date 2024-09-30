import type { AxiosError } from "axios";
import {
  createMessage,
  ERROR_413,
  GENERIC_API_EXECUTION_ERROR,
} from "ee/constants/messages";

export const handle413Error = async (error: AxiosError) => {
  if (error?.response?.status === 413) {
    return Promise.reject({
      ...error,
      clientDefinedError: true,
      statusCode: "AE-APP-4013",
      message: createMessage(ERROR_413, 100),
      pluginErrorDetails: {
        appsmithErrorCode: "AE-APP-4013",
        appsmithErrorMessage: createMessage(ERROR_413, 100),
        errorType: "INTERNAL_ERROR", // this value is from the server, hence cannot construct enum type.
        title: createMessage(GENERIC_API_EXECUTION_ERROR),
      },
    });
  }

  return null;
};
