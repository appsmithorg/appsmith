import {
  validateJsonResponseMeta,
  addExecutionMetaProperties,
} from "api/helpers";
import type { AxiosResponse } from "axios";
import { EXECUTION_ACTION_REGEX } from "ee/constants/ApiConstants";
import { getAppsmithConfigs } from "ee/configs";
import { handleVersionUpdate } from "../../../sagas/WebsocketSagas/versionUpdatePrompt";

export const apiSuccessResponseInterceptor = (response: AxiosResponse) => {
  if (response?.config?.url?.match(EXECUTION_ACTION_REGEX)) {
    return addExecutionMetaProperties(response);
  }

  validateJsonResponseMeta(response);

  const { appVersion } = getAppsmithConfigs();
  const versionInResponse = response.headers["x-appsmith-version"];

  if (versionInResponse !== appVersion.id) {
    handleVersionUpdate(appVersion, versionInResponse);

    return null;
  }

  return response.data;
};
