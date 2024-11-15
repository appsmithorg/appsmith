import { useCallback } from "react";
import { useSelector } from "react-redux";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { getPageNameByPageId } from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

function useAnalyticsOnRunClick() {
  const { action, datasource, plugin } = usePluginActionContext();
  const pageName = useSelector((state) =>
    getPageNameByPageId(state, action.pageId),
  );

  const actionId = action.id;
  const actionName = action.name;
  const datasourceId = datasource?.id;
  const pluginName = plugin.name;
  const isMock = !!datasource?.isMock || false; // as mock db exists only for postgres and mongo plugins

  const callRunActionAnalytics = useCallback(() => {
    AnalyticsUtil.logEvent("RUN_ACTION_CLICK", {
      actionId,
      actionName,
      datasourceId,
      pageName,
      pluginName,
      isMock,
    });
  }, [actionId, actionName, datasourceId, pageName, pluginName, isMock]);

  return { callRunActionAnalytics };
}

export { useAnalyticsOnRunClick };
