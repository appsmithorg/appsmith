import type { AxiosError } from "axios";
import { createMessage, ERROR_0 } from "ee/constants/messages";

export const handleOfflineError = async (error: AxiosError) => {
  if (!window.navigator.onLine) {
    return Promise.reject({
      ...error,
      message: createMessage(ERROR_0),
    });
  }

  return null;
};
