import type { ControlData } from "components/formControls/BaseControl";

export interface PluginSetting {
  id: number;
  sectionName: string;
  children: ControlData[];
}

export const filterWhitelistedConfig = (
  pluginSettings?: PluginSetting[],
  whitelisted?: string[],
) => {
  return (pluginSettings || [])
    .map((settingConfig) => {
      const children = settingConfig.children.filter((config) =>
        (whitelisted || []).includes(config.configProperty),
      );

      if (children.length === 0) {
        return null;
      }

      return {
        ...settingConfig,
        children,
      };
    })
    .filter(Boolean);
};
