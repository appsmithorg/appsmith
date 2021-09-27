import { HTTP_METHODS } from "constants/ApiEditorConstants";
import { ApiAction } from "entities/Action";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import isString from "lodash/isString";

export const transformRestAction = (data: ApiAction): ApiAction => {
  let action = cloneDeep(data);
  // // GET actions should not save body
  // if (action.actionConfiguration.httpMethod === HTTP_METHODS[0]) {
  //   delete action.actionConfiguration.body;
  // }
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
  if (action.actionConfiguration.httpMethod !== HTTP_METHODS[0]) {
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

function removeEmptyPairs(keyValueArray: any) {
  if (!keyValueArray || !keyValueArray.length) return keyValueArray;
  return keyValueArray.filter(
    (data: any) =>
      data &&
      (!isEmpty(data.key) || !isEmpty(data.value) || !isEmpty(data.type)),
  );
}
