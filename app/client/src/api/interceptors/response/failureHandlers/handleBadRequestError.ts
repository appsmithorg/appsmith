import type { AxiosError } from "axios";
import type { ApiResponse } from "../../../ApiResponses";
import { handleVersionMismatch } from "sagas/WebsocketSagas/versionUpdatePrompt";
import { getAppsmithConfigs } from "ee/configs";
import { SERVER_ERROR_CODES } from "ee/constants/ApiConstants";

export const handleBadRequestError = async (error: AxiosError<ApiResponse>) => {
  const errorCode = error?.response?.data?.responseMeta.error?.code;

  if (
    error?.response?.status === 400 &&
    SERVER_ERROR_CODES.VERSION_MISMATCH.includes("" + errorCode)
  ) {
    const responseData = error?.response?.data;
    const message = responseData?.responseMeta.error?.message;
    const serverVersion = (responseData?.data as { serverVersion: string })
      .serverVersion;

    handleVersionMismatch(getAppsmithConfigs().appVersion.id, serverVersion);

    return Promise.reject({
      ...error,
      clientDefinedError: true,
      statusCode: errorCode,
      message,
    });
  }

  return null;
};
