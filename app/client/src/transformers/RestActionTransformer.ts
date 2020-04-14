import { POST_BODY_FORMAT_OPTIONS } from "constants/ApiEditorConstants";

export const transformRestAction = (data: any): any => {
  let action = { ...data };
  if (
    data.actionConfiguration.queryParameters &&
    data.actionConfiguration.queryParameters.length
  ) {
    const path = data.actionConfiguration.path;
    if (path && path.indexOf("?") > -1) {
      action = {
        ...data,
        actionConfiguration: {
          ...data.actionConfiguration,
          path: path.substr(0, path.indexOf("?")),
        },
      };
    }
  }
  if (
    data.displayFormat &&
    data.displayFormat === POST_BODY_FORMAT_OPTIONS[0].value
  ) {
    if (data.actionConfiguration.body[0]) {
      const body = data.actionConfiguration.body[0];
      action = {
        ...data,
        actionConfiguration: {
          ...data.actionConfiguration,
          body,
        },
      };
    }
  }
  if (
    data.displayFormat &&
    data.displayFormat === POST_BODY_FORMAT_OPTIONS[1].value
  ) {
    if (data.actionConfiguration.body[1]) {
      const body = data.actionConfiguration.body[1];
      if (typeof data.actionConfiguration.body === "object") {
        action = {
          ...data,
          actionConfiguration: {
            ...data.actionConfiguration,
            body: JSON.stringify(body),
          },
        };
      }
    }
  }
  return action;
};
