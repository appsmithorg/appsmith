import {
  HTTP_METHOD,
  CONTENT_TYPE_HEADER_KEY,
} from "constants/ApiEditorConstants";
import { ApiAction } from "entities/Action";
import isEmpty from "lodash/isEmpty";
import isString from "lodash/isString";
import cloneDeep from "lodash/cloneDeep";

export const transformRestAction = (data: ApiAction): ApiAction => {
  let action = cloneDeep(data);
  const actionConfigurationHeaders = action.actionConfiguration.headers;

  const contentTypeHeaderIndex = actionConfigurationHeaders.findIndex(
    (header: { key: string; value: string }) =>
      header?.key?.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
  );

  // GET actions should not save body if the content-type is set to empty
  // In all other scenarios, GET requests will save & execute the action with
  // the request body
  if (
    action.actionConfiguration.httpMethod === HTTP_METHOD.GET &&
    contentTypeHeaderIndex == -1
  ) {
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
          path: path.slice(0, path.indexOf("?")),
        },
      };
    }
  }
  // Body should send correct format depending on the content type
  if (action.actionConfiguration.httpMethod !== HTTP_METHOD.GET) {
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

  action.actionConfiguration.bodyFormData = removeEmptyPairs(
    action.actionConfiguration.bodyFormData,
  );
  action.actionConfiguration.headers = removeEmptyPairs(
    action.actionConfiguration.headers,
  );
  action.actionConfiguration.queryParameters = removeEmptyPairs(
    action.actionConfiguration.queryParameters,
  );

  return action;
};

// Filters empty key-value pairs or key-value-type(Multipart) from form data, headers and query params
function removeEmptyPairs(keyValueArray: any) {
  if (!keyValueArray || !keyValueArray.length) return keyValueArray;
  return keyValueArray.filter(
    (data: any) =>
      data &&
      (!isEmpty(data.key) || !isEmpty(data.value) || !isEmpty(data.type)),
  );
}
