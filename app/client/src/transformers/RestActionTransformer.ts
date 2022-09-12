import {
  HTTP_METHOD,
  CONTENT_TYPE_HEADER_KEY,
} from "constants/ApiEditorConstants/CommonApiConstants";
import { ApiAction } from "entities/Action";
import isEmpty from "lodash/isEmpty";
import isString from "lodash/isString";
import cloneDeep from "lodash/cloneDeep";
import {
  getDynamicStringSegments,
  isDynamicValue,
} from "utils/DynamicBindingUtils";

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

    // This can help extract paths from the following examples
    const templatePaths = extractApiUrlPath(path);

    if (path && templatePaths !== path) {
      action = {
        ...action,
        actionConfiguration: {
          ...action.actionConfiguration,
          path: templatePaths,
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

// This function extracts the appropriate paths regardless of whatever expressions exist within the dynamic bindings.

// Example 1:  `/{{Text1.text ? 'users' : 'user'}}`
// Example 2:  `/{{Text1.text ? 'users' : 'user'}}/{{"test"}}?`
// Example 3:  `/{{Text1.text ? 'users' : 'user'}}/{{"test"}}?a=hello&b=world`

// Output 1: /{{Text1.text ? 'users' : 'user'}}`
// Output 2: /{{Text1.text ? 'users' : 'user'}}/{{"test"}}`
// Output 3: /{{Text1.text ? 'users' : 'user'}}/{{"test"}}`

export const extractApiUrlPath = (path: string | undefined) => {
  const dynamicStringSegments = getDynamicStringSegments(path || "");
  const dynamicValuesDetected: string[] = [];

  const templateStringSegments = dynamicStringSegments.map((segment) => {
    if (isDynamicValue(segment)) {
      dynamicValuesDetected.push(segment);
      return "~";
    }
    return segment;
  });

  const indexOfQueryParams = templateStringSegments.join("").indexOf("?");

  let templatePaths = templateStringSegments
    .join("")
    .slice(0, indexOfQueryParams === -1 ? undefined : indexOfQueryParams);

  dynamicValuesDetected.forEach((val) => {
    templatePaths = templatePaths.replace(/~/, val);
  });

  return templatePaths;
};
