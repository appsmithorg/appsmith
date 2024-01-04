import type { PluginSettings } from "@appsmith/constants/ModuleConstants";
import { getPluginSettingConfigs } from "@appsmith/selectors/entitiesSelector";
import { PluginType } from "entities/Action";
import { useSelector } from "react-redux";

interface UseModuleFallbackSettingsForm {
  pluginType: PluginType;
  pluginId: string;
  interfaceType: "CONSUMER" | "CREATOR";
}

const WHITELISTED_SETTINGS_FOR_CREATOR: Record<PluginType, string[]> = {
  [PluginType.API]: [
    "actionConfiguration.encodeParamsToggle",
    "actionConfiguration.pluginSpecifiedTemplates[0].value",
    "actionConfiguration.httpVersion",
    "actionConfiguration.timeoutInMillisecond",
  ],
  [PluginType.DB]: ["actionConfiguration.timeoutInMillisecond"],
  [PluginType.SAAS]: ["actionConfiguration.timeoutInMillisecond"],
  [PluginType.JS]: [],
  [PluginType.REMOTE]: ["actionConfiguration.timeoutInMillisecond"],
  [PluginType.AI]: ["actionConfiguration.timeoutInMillisecond"],
};
const WHITELISTED_SETTINGS_FOR_CONSUMER: Record<PluginType, string[]> = {
  [PluginType.API]: ["executeOnLoad", "confirmBeforeExecute"],
  [PluginType.DB]: ["executeOnLoad", "confirmBeforeExecute"],
  [PluginType.SAAS]: ["executeOnLoad", "confirmBeforeExecute"],
  [PluginType.JS]: [],
  [PluginType.REMOTE]: ["executeOnLoad", "confirmBeforeExecute"],
  [PluginType.AI]: ["executeOnLoad", "confirmBeforeExecute"],
};

function useModuleFallbackSettingsForm({
  interfaceType,
  pluginId,
  pluginType,
}: UseModuleFallbackSettingsForm) {
  const settingsConfig: PluginSettings[] =
    useSelector((state) => getPluginSettingConfigs(state, pluginId)) || [];

  const whiteListedKeys =
    interfaceType === "CONSUMER"
      ? WHITELISTED_SETTINGS_FOR_CONSUMER
      : WHITELISTED_SETTINGS_FOR_CREATOR;

  return settingsConfig.map((settings) => {
    return {
      ...settings,
      children: (settings.children || []).filter((config) => {
        return whiteListedKeys[pluginType]?.includes(config.configProperty);
      }),
    };
  });
}

export default useModuleFallbackSettingsForm;
