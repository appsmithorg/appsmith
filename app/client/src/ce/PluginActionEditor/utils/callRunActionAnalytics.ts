import type { Plugin } from "api/PluginApi";
import type { Datasource, EmbeddedRestDatasource } from "entities/Datasource";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { Action } from "entities/Action";
import { type IDEType } from "ee/entities/IDE/constants";

function callRunActionAnalytics({
  action,
  datasource,
  pageName,
  plugin,
}: {
  action: Action;
  IDEType: IDEType;
  pageName: string;
  plugin: Plugin;
  datasource?: EmbeddedRestDatasource | Datasource;
}) {
  const actionId = action.id;
  const actionName = action.name;
  const datasourceId = datasource?.id;
  const pluginName = plugin.name;
  const isMock = !!datasource?.isMock || false; // as mock db exists only for postgres and mongo plugins

  AnalyticsUtil.logEvent("RUN_ACTION_CLICK", {
    actionId,
    actionName,
    datasourceId,
    pageName,
    pluginName,
    isMock,
  });
}

export { callRunActionAnalytics };
