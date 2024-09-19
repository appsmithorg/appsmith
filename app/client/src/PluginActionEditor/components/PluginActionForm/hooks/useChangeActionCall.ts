import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { changeApi } from "actions/apiPaneActions";
import { changeQuery } from "actions/queryPaneActions";
import { PluginType } from "entities/Action";
import { usePluginActionContext } from "PluginActionEditor";

export const useChangeActionCall = () => {
  const { action, plugin } = usePluginActionContext();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!plugin?.id || !action) return;

    switch (plugin?.type) {
      case PluginType.API:
        dispatch(changeApi(action?.id, false));
        break;
      default:
        dispatch(
          changeQuery({
            baseQueryId: action?.id,
            basePageId: action.pageId,
            applicationId: action.applicationId,
            packageId: action.packageId,
            moduleId: action.moduleId,
            workflowId: action.workflowId,
          }),
        );
        break;
    }
  }, [action, plugin, dispatch]);
};
