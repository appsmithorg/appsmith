import React, { memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import Entity, { EntityClassNames } from "../Entity";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import history, { NavigationMethod } from "utils/history";
import {
  getActionByBaseId,
  getDatasource,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import type { Action, StoredDatasource } from "entities/Action";
import { PluginType } from "entities/Action";
import { keyBy } from "lodash";
import { getActionConfig } from "./helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useLocation } from "react-router";
import type { Datasource } from "entities/Datasource";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { saveActionNameBasedOnIdeType } from "ee/actions/helpers";
import { convertToBaseParentEntityIdSelector } from "selectors/pageListSelectors";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";

interface ExplorerActionEntityProps {
  step: number;
  searchKeyword?: string;
  baseId: string;
  type: PluginType;
  isActive: boolean;
  parentEntityId: string;
}

export const ExplorerActionEntity = memo((props: ExplorerActionEntityProps) => {
  const action = useSelector((state) =>
    getActionByBaseId(state, props.baseId),
  ) as Action;
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const location = useLocation();
  const datasource = useSelector((state) =>
    getDatasource(state, (action?.datasource as StoredDatasource)?.id),
  ) as Datasource;
  const baseParentEntityId = useSelector((state) =>
    convertToBaseParentEntityIdSelector(state, props.parentEntityId),
  );
  const ideType = getIDETypeByUrl(location.pathname);

  const config = getActionConfig(props.type);
  const url = config?.getURL(
    baseParentEntityId ?? "",
    action.baseId,
    action.pluginType,
    pluginGroups[action.pluginId],
  );
  const icon = config?.getIcon(action, pluginGroups[action.pluginId]);

  const switchToAction = useCallback(() => {
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
      pluginType={action.pluginType}
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
      updateEntityName={(id, name) =>
        saveActionNameBasedOnIdeType(id, name, ideType)
      }
    />
  );
});

ExplorerActionEntity.displayName = "ExplorerActionEntity";

export default ExplorerActionEntity;
