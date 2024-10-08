import { deleteAction, runAction } from "actions/pluginActionActions";
import type { PaginationField } from "api/ActionAPI";
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

function useHandleRunClick() {
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const handleRunClick = useCallback(
    (paginationField?: PaginationField) => {
      dispatch(runAction(action?.id ?? "", paginationField));
    },
    [action.id, dispatch],
  );

  return { handleRunClick };
}

export { useHandleDeleteClick, useHandleRunClick };
