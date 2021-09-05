import {
  HTTP_METHODS_ENUM,
  CONTENT_TYPE_HEADER_KEY,
} from "constants/ApiEditorConstants";
import { ApiAction } from "entities/Action";
import { isString, cloneDeep } from "lodash";
import log from "loglevel";

export const transformRestAction = (data: ApiAction): ApiAction => {
  let action = cloneDeep(data);
  const actionConfigurationHeaders = action.actionConfiguration.headers;

  const contentTypeHeaderIndex = actionConfigurationHeaders.findIndex(
    (header: { key: string; value: string }) =>
      header &&
      header.key &&
      header.key.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
  );

  // GET actions should not save body if the content-type is set to empty
  // In all other scenarios, GET requests will save & execute the action with
  // the request body
  if (
    action.actionConfiguration.httpMethod === HTTP_METHODS_ENUM.GET.value &&
    contentTypeHeaderIndex == -1
  ) {
    log.debug("Deleting the body for GET request");
    delete action.actionConfiguration.body;
  }

  // Paths should not have query params
  if (
    action.actionConfiguration.queryParameters &&
    action.actionConfiguration.queryParameters.length
  ) {
    const path = action.actionConfiguration.path;
    if (path && path.indexOf("?") > -1) {
      action = {
        ...action,
        actionConfiguration: {
          ...action.actionConfiguration,
          path: path.substr(0, path.indexOf("?")),
        },
      };
    }
  }
  // Body should send correct format depending on the content type
  if (action.actionConfiguration.httpMethod !== HTTP_METHODS_ENUM.GET.value) {
    let body: any = "";
    if (action.actionConfiguration.body) {
      body = action.actionConfiguration.body || undefined;
    }

    if (!isString(body)) body = JSON.stringify(body);
    action = {
      ...action,
      actionConfiguration: {
        ...action.actionConfiguration,
        body,
      },
    };
  }

  return action;
};
