import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { runAction } from "actions/pluginActionActions";
import type { PaginationField } from "api/ActionAPI";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { getPageNameByPageId } from "ee/selectors/entitiesSelector";
import { callRunActionAnalytics } from "ee/PluginActionEditor/utils/callRunActionAnalytics";

function useHandleRunClick() {
  const { action, datasource, plugin } = usePluginActionContext();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const IDEType = getIDETypeByUrl(pathname);

  const pageName = useSelector((state) =>
    getPageNameByPageId(state, action.pageId),
  );

  const handleRunClick = useCallback(
    (paginationField?: PaginationField) => {
      callRunActionAnalytics({
        action,
        IDEType,
        pageName,
        plugin,
        datasource,
      });
      dispatch(runAction(action?.id ?? "", paginationField));
    },
    [action.id, dispatch],
  );

  return { handleRunClick };
}

export { useHandleRunClick };
