import { getHasExecuteActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { DEFAULT_DATASOURCE_NAME } from "PluginActionEditor/constants/ApiEditorConstants";
import { UIComponentTypes } from "entities/Plugin";
import { SQL_DATASOURCES } from "constants/QueryEditorConstants";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";

const useBlockExecution = () => {
  const { action, plugin } = usePluginActionContext();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );

  let actionBody = "";
  let blockExecution = false;

  // API Editor Constants
  // this gets the url of the current action's datasource
  const actionDatasourceUrl =
    action.datasource.datasourceConfiguration?.url || "";
  const actionDatasourceUrlPath = action.actionConfiguration?.path || "";
  // this gets the name of the current action's datasource
  const actionDatasourceName = action.datasource.name || "";

  // Query Editor Constants
  if (!!action.actionConfiguration) {
    if ("formData" in action.actionConfiguration) {
      // if the action has a formData (the action is postUQI e.g. Oracle)
      actionBody = action.actionConfiguration.formData?.body?.data || "";
    } else {
      // if the action is pre UQI, the path is different e.g. mySQL
      actionBody = action.actionConfiguration?.body || "";
    }
  }

  if (
    [
      UIComponentTypes.ApiEditorForm,
      UIComponentTypes.GraphQLEditorForm,
    ].includes(plugin.uiComponent)
  ) {
    // if the url is empty and the action's datasource name is the default datasource name (this means the api does not have a datasource attached)
    // or the user does not have permission,
    // we block action execution.
    blockExecution =
      (!actionDatasourceUrl &&
        !actionDatasourceUrlPath &&
        actionDatasourceName === DEFAULT_DATASOURCE_NAME) ||
      !isExecutePermitted;
  } else {
    // if (the body is empty and the action is an sql datasource) or the user does not have permission, block action execution.
    blockExecution =
      (!actionBody && SQL_DATASOURCES.includes(plugin.name)) ||
      !isExecutePermitted;
  }

  return blockExecution;
};

export { useBlockExecution };
