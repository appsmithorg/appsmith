import type { AxiosError } from "axios";
import type { ApiResponse } from "api/types";
import captureException from "instrumentation/sendFaroErrors";

export const handleMissingResponseMeta = async (
  error: AxiosError<ApiResponse>,
) => {
  if (error.response?.data && !error.response.data.responseMeta) {
    captureException(new Error("Api responded without response meta"), {
      errorName: "MissingResponseMeta",
      contexts: { response: { ...error.response.data } },
    });

    return Promise.reject(error.response.data);
  }

  return null;
};
