import type { AxiosError } from "axios";
import type { ApiResponse, ErrorHandler } from "api/types";

import * as failureHandlers from "./failureHandlers";

export const apiFailureResponseInterceptor = async (
  error: AxiosError<ApiResponse>,
) => {
  const handlers: ErrorHandler[] = [
    failureHandlers.handle413Error,
    failureHandlers.handleOfflineError,
    failureHandlers.handleCancelError,
    failureHandlers.handleExecuteActionError,
    failureHandlers.handleTimeoutError,
    failureHandlers.handleServerError,
    failureHandlers.handleUnauthorizedError,
    failureHandlers.handleNotFoundError,
  ];

  for (const handler of handlers) {
    const result = await handler(error);

    if (result !== null) {
      return result;
    }
  }

  return Promise.reject(error);
};
