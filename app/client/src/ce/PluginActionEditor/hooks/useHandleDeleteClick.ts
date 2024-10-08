import { deleteAction } from "actions/pluginActionActions";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

function useHandleDeleteClick() {
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const handleDeleteClick = useCallback(
    ({ onSuccess }: { onSuccess?: () => void }) => {
      dispatch(
        deleteAction({
          id: action?.id ?? "",
          name: action?.name ?? "",
          onSuccess,
        }),
      );
    },
    [action.id, action.name, dispatch],
  );

  return { handleDeleteClick };
}

export { useHandleDeleteClick };
