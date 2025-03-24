import type { AxiosError } from "axios";
import type { ApiResponse } from "api/types";
import { faro } from "instrumentation";

export const handleMissingResponseMeta = async (
  error: AxiosError<ApiResponse>,
) => {
  if (error.response?.data && !error.response.data.responseMeta) {
    faro?.api.pushError(
      {
        ...new Error("Api responded without response meta"),
        name: "API_RESPONSE_META_MISSING",
      },
      {
        type: "error",
        context: { response: JSON.stringify(error.response.data) },
      },
    );

    return Promise.reject(error.response.data);
  }

  return null;
};
