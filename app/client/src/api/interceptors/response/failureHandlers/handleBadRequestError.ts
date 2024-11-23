import type { AxiosError } from "axios";
import type { ApiResponse } from "../../../ApiResponses";
import { handleVersionUpdate } from "../../../../sagas/WebsocketSagas/versionUpdatePrompt";
import { getAppsmithConfigs } from "ee/configs";

export const handleBadRequestError = async (error: AxiosError<ApiResponse>) => {
  const errorCode = error?.response?.data?.responseMeta.error?.code;

  if (error?.response?.status === 400 && errorCode === "AE-BAD-4002") {
    const message = error?.response?.data?.responseMeta.error?.message;
    const serverVersion = message?.match(/\bexpected '(.+?)'/)?.[1];

    if (!serverVersion) {
      // This shouldn't happen, throw an error if it does?
      return null;
    }

    // todo: this second argument should be needed anymore. We know here already that there's a mismatch.
    handleVersionUpdate(getAppsmithConfigs().appVersion, serverVersion);

    return Promise.reject({
      ...error,
      clientDefinedError: true,
      statusCode: errorCode,
      message,
    });
  }

  return null;
};
