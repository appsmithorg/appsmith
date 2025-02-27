import React, { useCallback, useMemo } from "react";
import { EntityItem, EntityContextMenu } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import {
  getActionByBaseId,
  getDatasource,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import { type Action, type StoredDatasource } from "entities/Action";
import { useDispatch, useSelector } from "react-redux";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { Datasource } from "entities/Datasource";
import history, { NavigationMethod } from "utils/history";
import { keyBy } from "lodash";
import { saveActionNameBasedOnIdeType } from "ee/actions/helpers";
import { useNameEditorState } from "IDE/hooks/useNameEditorState";
import { useValidateEntityName } from "IDE";
import { useLocation } from "react-router";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { PluginType } from "entities/Plugin";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import { AppQueryContextMenuItems } from "./AppQueryContextMenuItems";
import type { EntityItem as EntityItemProps } from "ee/IDE/Interfaces/EntityItem";

export const QueryEntityItem = ({ item }: { item: EntityItemProps }) => {
  const action = useSelector((state: AppState) =>
    getActionByBaseId(state, item.key),
  ) as Action;
  const datasource = useSelector((state) =>
    getDatasource(state, (action?.datasource as StoredDatasource)?.id),
  ) as Datasource;
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const location = useLocation();
  const ideType = getIDETypeByUrl(location.pathname);
  const activeActionBaseId = useActiveActionBaseId();
  const { parentEntityId } = useParentEntityInfo(ideType);

  const { editingEntity, enterEditMode, exitEditMode, updatingEntity } =
    useNameEditorState();

  const validateName = useValidateEntityName({
    entityName: item.title,
  });
  const dispatch = useDispatch();
  const contextMenu = useMemo(
    () => (
      <EntityContextMenu>
        <AppQueryContextMenuItems action={action} />
      </EntityContextMenu>
    ),
    [action],
  );

  const actionPermissions = action.userPermissions || [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canManageAction = getHasManageActionPermission(
    isFeatureEnabled,
    actionPermissions,
  );

  const config = getActionConfig(action.pluginType);
  const url = config?.getURL(
    parentEntityId ?? "",
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
  }, [url, location.pathname, action, datasource, pluginGroups]);

  const nameEditorConfig = useMemo(() => {
    return {
      canEdit: canManageAction,
      isEditing: editingEntity === action.id,
      isLoading: updatingEntity === action.id,
      onEditComplete: exitEditMode,
      onNameSave: (newName: string) =>
        dispatch(saveActionNameBasedOnIdeType(action.id, newName, ideType)),
      validateName: (newName: string) => validateName(newName, item.title),
    };
  }, [
    canManageAction,
    editingEntity,
    exitEditMode,
    ideType,
    item.title,
    action.id,
    updatingEntity,
  ]);

  return (
    <EntityItem
      className="action t--action-entity"
      id={action.id}
      isSelected={activeActionBaseId === item.key}
      key={action.id}
      nameEditorConfig={nameEditorConfig}
      onClick={switchToAction}
      onDoubleClick={() => enterEditMode(action.id)}
      rightControl={contextMenu}
      rightControlVisibility="hover"
      startIcon={icon}
      title={item.title}
    />
  );
};
