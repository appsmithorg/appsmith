import { useSelector } from "react-redux";
import { getPluginSettingConfigs } from "ee/selectors/entitiesSelector";
import type { Action } from "entities/Action";

function useActionSettingsConfig(action?: Action) {
  return useSelector((state) =>
    getPluginSettingConfigs(state, action?.pluginId || ""),
  );
}

export { useActionSettingsConfig };
