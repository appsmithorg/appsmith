import { PluginPackageName } from "entities/Plugin";

// Map of plugin name to action property key to analytics key
// This contains a list allowed action property keys that can be sent to analytics
const pluginActionAnalyticsConfig: { [key: string]: Record<string, string> } = {
  [PluginPackageName.APPSMITH_AI]: {
    "actionConfiguration.formData.usecase.data": "usecase",
  },
};

// Get the pluginActionAnalyticsConfig for a plugin
export const getAllowedActionAnalyticsKeys = (
  pluginName: PluginPackageName,
) => {
  return pluginActionAnalyticsConfig[pluginName] ?? {};
};
