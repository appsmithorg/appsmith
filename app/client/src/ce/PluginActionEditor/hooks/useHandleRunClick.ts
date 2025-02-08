import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { runAction } from "actions/pluginActionActions";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { PluginType } from "../../../entities/Plugin";
import { getIsAnvilEnabledInCurrentApplication } from "../../../layoutSystems/anvil/integrations/selectors";

function useHandleRunClick() {
  const { action, plugin } = usePluginActionContext();
  const dispatch = useDispatch();
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

  const handleRunClick = useCallback(() => {
    const skipOpeningDebugger = isAnvilEnabled && plugin.type === PluginType.AI;

    dispatch(runAction(action?.id ?? "", undefined, skipOpeningDebugger));
  }, [action?.id, dispatch, isAnvilEnabled, plugin.type]);

  return { handleRunClick };
}

export { useHandleRunClick };
