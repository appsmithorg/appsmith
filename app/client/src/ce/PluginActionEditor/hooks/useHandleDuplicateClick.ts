import { copyActionRequest } from "actions/pluginActionActions";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

function useHandleDuplicateClick() {
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const handleDuplicateClick = useCallback(
    (destinationEntityId: string) => {
      dispatch(
        copyActionRequest({
          id: action.id,
          destinationEntityId,
          name: action.name,
        }),
      );
    },
    [action.id, action.name, dispatch],
  );

  return { handleDuplicateClick };
}

export { useHandleDuplicateClick };
