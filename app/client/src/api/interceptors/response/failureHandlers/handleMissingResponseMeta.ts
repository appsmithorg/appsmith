import type { AxiosError } from "axios";
import * as Sentry from "@sentry/react";
import type { ApiResponse } from "api/types";

export const handleMissingResponseMeta = async (
  error: AxiosError<ApiResponse>,
) => {
  if (error.response?.data && !error.response.data.responseMeta) {
    Sentry.captureException(new Error("Api responded without response meta"), {
      contexts: { response: { ...error.response.data } },
    });

    return Promise.reject(error.response.data);
  }

  return null;
};
