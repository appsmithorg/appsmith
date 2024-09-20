import { useSelector } from "react-redux";
import { getPluginSettingConfigs } from "ee/selectors/entitiesSelector";
import { usePluginActionContext } from "PluginActionEditor";

function useActionSettingsConfig() {
  const { plugin } = usePluginActionContext();

  return useSelector((state) => getPluginSettingConfigs(state, plugin.id));
}

export { useActionSettingsConfig };
