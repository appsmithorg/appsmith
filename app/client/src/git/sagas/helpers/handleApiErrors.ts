import { appsmithTelemetry } from "instrumentation";
import type { ApiResponse } from "api/types";
import log from "loglevel";

export default function handleApiErrors(error?: Error, response?: ApiResponse) {
  let apiError = null;

  if (response && !response.responseMeta.success) {
    if (response.responseMeta?.error) {
      apiError = response.responseMeta.error;
    } else if (response.responseMeta.status === 404) {
      apiError = {
        code: "NOT_FOUND",
        message: "Not found",
      };
    } else {
      log.error(error);
      apiError = {
        code: "UNKNOWN",
        message: "Unknown error",
      };
    }
  } else {
    log.error(error);
    appsmithTelemetry.captureException(error, { errorName: "GitApiError" });
  }

  return apiError;
}
