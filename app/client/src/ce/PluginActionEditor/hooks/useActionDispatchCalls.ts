import { deleteAction, runAction } from "actions/pluginActionActions";
import type { PaginationField } from "api/ActionAPI";
import { usePluginActionContext } from "PluginActionEditor";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

function useActionDispatchCalls() {
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const handleRunClick = useCallback(
    (paginationField?: PaginationField) => {
      dispatch(runAction(action?.id ?? "", paginationField));
    },
    [action.id, dispatch],
  );

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

  return { handleRunClick, handleDeleteClick };
}

export { useActionDispatchCalls };
