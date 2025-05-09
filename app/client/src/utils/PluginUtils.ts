import { RUN_BEHAVIOR_CONFIG_PROPERTY } from "constants/AppsmithActionConstants/formConfig/PluginSettings";
import type {
  PluginActionSettingsConfig,
  PluginActionSettingsConfigChildren,
} from "PluginActionEditor/types/PluginActionTypes";

export const updateRunBehaviourForActionSettings = (
  pluginSettings: PluginActionSettingsConfig[],
  flagValueForReactiveActions: boolean,
): PluginActionSettingsConfig[] => {
  return pluginSettings.map((settings) => ({
    ...settings,
    children: settings.children.map(
      (settings: PluginActionSettingsConfigChildren) => {
        if (
          settings.configProperty === RUN_BEHAVIOR_CONFIG_PROPERTY &&
          settings.options
        ) {
          return {
            ...settings,
            options: [
              ...settings.options.filter(
                (option) =>
                  (!flagValueForReactiveActions &&
                    option.value !== "AUTOMATIC") ||
                  flagValueForReactiveActions,
              ),
            ],
          };
        }

        return settings;
      },
    ),
  }));
};
