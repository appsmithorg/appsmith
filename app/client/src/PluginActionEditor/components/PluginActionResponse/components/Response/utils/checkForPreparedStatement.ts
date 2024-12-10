import { PluginType, type Action } from "entities/Action";

export function checkForPreparedStatement(action: Action) {
  const { actionConfiguration } = action;

  if (PluginType.DB !== action.pluginType) {
    return false;
  }

  if (actionConfiguration?.pluginSpecifiedTemplates?.[0]?.value === true) {
    return true;
  }

  const preparedStatement = actionConfiguration?.formData?.preparedStatement;

  if (
    preparedStatement &&
    typeof preparedStatement === "object" &&
    "data" in preparedStatement &&
    preparedStatement.data === true
  ) {
    return true;
  }

  return false;
}
