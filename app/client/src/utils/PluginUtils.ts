import { objectKeys } from "@appsmith/utils";
import type { PluginType } from "entities/Plugin";
import { RUN_BEHAVIOR_CONFIG_PROPERTY } from "constants/AppsmithActionConstants/formConfig/PluginSettings";
import {
  ActionRunBehaviour,
  type PluginActionSettingsConfig,
} from "PluginActionEditor/types/PluginActionTypes";

export const updatePluginRunBehaviourForPluginSettings = (
  pluginSettings: Record<PluginType, PluginActionSettingsConfig[]>,
  flagValueForReactiveActions: boolean,
) => {
  if (!flagValueForReactiveActions) {
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
                    options: child.options.filter(
                      (option) => option.value !== ActionRunBehaviour.AUTOMATIC,
                    ),
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
