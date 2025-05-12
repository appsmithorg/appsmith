import { RUN_BEHAVIOR_CONFIG_PROPERTY } from "constants/AppsmithActionConstants/formConfig/PluginSettings";
import {
  ActionRunBehaviour,
  type ActionSettingsConfig,
  type ActionSettingsConfigChildren,
} from "PluginActionEditor/types/PluginActionTypes";

export const updateRunBehaviourForActionSettings = (
  actionSettings: ActionSettingsConfig[],
  flagValueForReactiveActions: boolean,
): ActionSettingsConfig[] => {
  return actionSettings.map((settings) => ({
    ...settings,
    children: settings.children.map(
      (settings: ActionSettingsConfigChildren) => {
        if (
          settings.configProperty === RUN_BEHAVIOR_CONFIG_PROPERTY &&
          settings.options
        ) {
          return {
            ...settings,
            options: [
              ...settings.options.filter(
                (option) =>
                  flagValueForReactiveActions ||
                  option.value !== ActionRunBehaviour.AUTOMATIC,
              ),
            ],
          };
        }

        return settings;
      },
    ),
  }));
};
