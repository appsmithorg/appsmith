import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { runAction } from "actions/pluginActionActions";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";

function useHandleRunClick() {
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const handleRunClick = useCallback(
    (skipOpeningDebugger = false) => {
      dispatch(runAction(action?.id ?? "", undefined, skipOpeningDebugger));
    },
    [action.id, dispatch],
  );

  return { handleRunClick };
}

export { useHandleRunClick };
