import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { PluginType } from "entities/Action";
import { usePluginActionContext } from "../../../PluginActionContext";
import { changeApi, changeQuery } from "../../../store";
import usePrevious from "utils/hooks/usePrevious";

export const useChangeActionCall = () => {
  const { action, plugin } = usePluginActionContext();
  const prevActionId = usePrevious(action.id);
  const dispatch = useDispatch();

  useEffect(() => {
    if (prevActionId === action.id) return;

    switch (plugin?.type) {
      case PluginType.API:
        dispatch(changeApi(action?.id, false));
        break;
      default:
        dispatch(
          changeQuery({
            baseQueryId: action.baseId,
            basePageId: action.pageId,
            applicationId: action.applicationId,
            packageId: action.packageId,
            moduleId: action.moduleId,
            workflowId: action.workflowId,
          }),
        );
        break;
    }
  }, [action, plugin, dispatch, prevActionId]);
};
