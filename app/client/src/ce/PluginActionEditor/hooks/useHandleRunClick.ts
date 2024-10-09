import { runAction } from "actions/pluginActionActions";
import type { PaginationField } from "api/ActionAPI";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

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

export { useHandleRunClick };
