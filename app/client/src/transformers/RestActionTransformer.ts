import { HTTP_METHODS, POST_BODY_FORMATS } from "constants/ApiEditorConstants";
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
      const contentTypeHeader = _.find(action.actionConfiguration.headers, {
        key: "content-type",
      });
      if (contentTypeHeader) {
        contentType = contentTypeHeader.value;
      }
    }
    let formatIndex = 2;
    if (POST_BODY_FORMATS.includes(contentType)) {
      formatIndex = POST_BODY_FORMATS.indexOf(contentType);
    }

    let body = action.actionConfiguration.body[formatIndex] || undefined;
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
