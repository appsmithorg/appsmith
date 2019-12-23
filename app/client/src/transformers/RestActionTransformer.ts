import { RestAction } from "api/ActionAPI";

export const transformRestAction = (data: RestAction): RestAction => {
  let action = { ...data };
  if (data.pluginType === "API") {
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
  return action;
};
