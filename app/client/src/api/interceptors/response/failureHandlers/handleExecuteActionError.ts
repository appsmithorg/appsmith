import type { AxiosError, AxiosResponse } from "axios";
import { addExecutionMetaProperties } from "api/helpers";
import { EXECUTION_ACTION_REGEX } from "ee/constants/ApiConstants";

export function handleExecuteActionError(error: AxiosError) {
  const isExecutionActionURL =
    error.config && error?.config?.url?.match(EXECUTION_ACTION_REGEX);

  if (isExecutionActionURL) {
    return addExecutionMetaProperties(error?.response as AxiosResponse);
  }

  return null;
}
