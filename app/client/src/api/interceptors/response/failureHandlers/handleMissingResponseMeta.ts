import type { AxiosError } from "axios";
import type { ApiResponse } from "api/types";
import { captureException } from "instrumentation";

export const handleMissingResponseMeta = async (
  error: AxiosError<ApiResponse>,
) => {
  if (error.response?.data && !error.response.data.responseMeta) {
    captureException(new Error("Api responded without response meta"), {
      context: {
        request: error.response.request,
        responseCode: error.response.data.code || "",
      },
    });

    return Promise.reject(error.response.data);
  }

  return null;
};
