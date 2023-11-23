import React, { memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import Entity, { EntityClassNames } from "../Entity";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import history, { NavigationMethod } from "utils/history";
import { saveActionName } from "actions/pluginActionActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  getAction,
  getDatasource,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import type { Action, StoredDatasource } from "entities/Action";
import { PluginType } from "entities/Action";
import { keyBy } from "lodash";
import { getActionConfig } from "./helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";
import type { Datasource } from "entities/Datasource";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

const getUpdateActionNameReduxAction = (id: string, name: string) => {
  return saveActionName({ id, name });
};

interface ExplorerActionEntityProps {
  step: number;
  searchKeyword?: string;
  id: string;
  type: PluginType;
  isActive: boolean;
}

export const ExplorerActionEntity = memo((props: ExplorerActionEntityProps) => {
  const pageId = useSelector(getCurrentPageId);
  const action = useSelector((state) => getAction(state, props.id)) as Action;
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const location = useLocation();
  const datasource = useSelector((state) =>
    getDatasource(state, (action?.datasource as StoredDatasource)?.id),
  ) as Datasource;

  const config = getActionConfig(props.type);
  const url = config?.getURL(
    pageId,
    action.id,
    action.pluginType,
    pluginGroups[action.pluginId],
  );
  const icon = config?.getIcon(action, pluginGroups[action.pluginId]);

  const switchToAction = useCallback(() => {
    PerformanceTracker.startTracking(PerformanceTransactionName.OPEN_ACTION, {
      url,
    });
    url && history.push(url, { invokedBy: NavigationMethod.EntityExplorer });
    AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
      type: "QUERIES/APIs",
      fromUrl: location.pathname,
      toUrl: url,
      name: action.name,
    });
    AnalyticsUtil.logEvent("EDIT_ACTION_CLICK", {
      actionId: action?.id,
      datasourceId: datasource?.id,
      pluginName: pluginGroups[action?.pluginId]?.name,
      actionType: action?.pluginType === PluginType.DB ? "Query" : "API",
      isMock: !!datasource?.isMock,
    });
  }, [url, location.pathname, action.name]);

  const actionPermissions = action.userPermissions || [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canDeleteAction = getHasDeleteActionPermission(
    isFeatureEnabled,
    actionPermissions,
  );

  const canManageAction = getHasManageActionPermission(
    isFeatureEnabled,
    actionPermissions,
  );

  const contextMenu = (
    <ActionEntityContextMenu
      canDeleteAction={canDeleteAction}
      canManageAction={canManageAction}
      className={EntityClassNames.CONTEXT_MENU}
      id={action.id}
      name={action.name}
      pageId={pageId}
    />
  );
  return (
    <Entity
      action={switchToAction}
      active={props.isActive}
      canEditEntityName={canManageAction}
      className="action t--action-entity"
      contextMenu={contextMenu}
      entityId={action.id}
      icon={icon}
      key={action.id}
      name={action.name}
      searchKeyword={props.searchKeyword}
      step={props.step}
      updateEntityName={getUpdateActionNameReduxAction}
    />
  );
});

ExplorerActionEntity.displayName = "ExplorerActionEntity";

export default ExplorerActionEntity;
