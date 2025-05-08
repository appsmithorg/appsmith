import { objectKeys } from "@appsmith/utils";
import type { PluginType } from "entities/Plugin";
import {
  AUTOMATIC_RUN_BEHAVIOR,
  RUN_BEHAVIOR_CONFIG_PROPERTY,
} from "constants/AppsmithActionConstants/formConfig/PluginSettings";
import type { PluginActionSettingsConfig } from "PluginActionEditor/types/PluginActionTypes";

export const updatePluginRunBehaviourForPluginSettings = (
  pluginSettings: Record<PluginType, PluginActionSettingsConfig[]>,
  flagValueForReactiveActions: boolean,
) => {
  if (flagValueForReactiveActions) {
    return objectKeys(pluginSettings).reduce(
      (acc: Record<PluginType, PluginActionSettingsConfig[]>, pluginType) => {
        acc[pluginType] = pluginSettings[pluginType].map(
          (plugin: PluginActionSettingsConfig) => {
            return {
              ...plugin,
              children: plugin.children.map((child) => {
                if (
                  child.configProperty === RUN_BEHAVIOR_CONFIG_PROPERTY &&
                  child.options
                ) {
                  return {
                    ...child,
                    options: [
                      AUTOMATIC_RUN_BEHAVIOR,
                      ...child.options.filter(
                        (option) =>
                          option.value !== AUTOMATIC_RUN_BEHAVIOR.value,
                      ),
                    ],
                  };
                }

                return child;
              }),
            };
          },
        );

        return acc;
      },
      pluginSettings,
    );
  }

  return pluginSettings;
};
