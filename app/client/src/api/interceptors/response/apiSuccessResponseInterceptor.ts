import {
  validateJsonResponseMeta,
  addExecutionMetaProperties,
} from "api/helpers";
import type { AxiosResponse } from "axios";
import { EXECUTION_ACTION_REGEX } from "ee/constants/ApiConstants";

export const apiSuccessResponseInterceptor = (response: AxiosResponse) => {
  if (response?.config?.url?.match(EXECUTION_ACTION_REGEX)) {
    return addExecutionMetaProperties(response);
  }

  validateJsonResponseMeta(response);

  return response.data;
};
