import {
  CONTENT_TYPE,
  HTTP_METHODS,
  POST_BODY_FORMATS,
  POST_BODY_FORMAT_OPTIONS,
} from "constants/ApiEditorConstants";
import _ from "lodash";

export const transformRestAction = (data: any): any => {
  let action = { ...data };
  // GET actions should not save body
  if (action.actionConfiguration.httpMethod === HTTP_METHODS[0]) {
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
  if (action.actionConfiguration.httpMethod !== HTTP_METHODS[0]) {
    let contentType = "raw";
    if (
      action.actionConfiguration.headers &&
      action.actionConfiguration.headers.length
    ) {
      const contentTypeHeader = _.find(
        action.actionConfiguration.headers,
        header => {
          return header.key.toLowerCase() === CONTENT_TYPE;
        },
      );
      if (contentTypeHeader) {
        contentType = contentTypeHeader.value;
      }
    }
    let body: any = "";

    if (
      contentType === POST_BODY_FORMAT_OPTIONS[0].value ||
      contentType === POST_BODY_FORMAT_OPTIONS[3].value
    ) {
      action.actionConfiguration.bodyFormData = undefined;
      if (action.actionConfiguration.body)
        body = action.actionConfiguration.body || undefined;
    }

    if (!_.isString(body)) body = JSON.stringify(body);
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
