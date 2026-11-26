import type { AxiosError, AxiosResponse } from "axios";
import { addExecutionMetaProperties } from "api/helpers";
import { EXECUTION_ACTION_REGEX } from "ee/constants/ApiConstants";

export function handleExecuteActionError(error: AxiosError) {
  const isExecutionActionURL =
    error.config && error?.config?.url?.match(EXECUTION_ACTION_REGEX);

  if (!isExecutionActionURL) {
    return null;
  }

  // A timeout or network failure has no response. Reject with the original
  // AxiosError so the action execution saga can describe the transport failure.
  if (!error.response) {
    return Promise.reject(error);
  }

  return addExecutionMetaProperties(error.response as AxiosResponse);
}
