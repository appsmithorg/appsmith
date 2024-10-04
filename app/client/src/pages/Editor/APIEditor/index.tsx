import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import {
  getIsActionConverting,
  getPageList,
  getPluginSettingConfigs,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import {
  deleteAction,
  runAction,
  saveActionName,
} from "actions/pluginActionActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import Editor from "./Editor";
import BackToCanvas from "components/common/BackToCanvas";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import {
  getIsEditorInitialized,
  getPagePermissions,
} from "selectors/editorSelectors";
import { getActionByBaseId } from "ee/selectors/entitiesSelector";
import type { APIEditorRouteParams } from "constants/routes";
import {
  getHasCreateActionPermission,
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { ApiEditorContextProvider } from "./ApiEditorContext";
import type { PaginationField } from "api/ActionAPI";
import { get, keyBy } from "lodash";
import ConvertToModuleInstanceCTA from "ee/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";
import { MODULE_TYPE } from "ee/constants/ModuleConstants";
import Disabler from "pages/common/Disabler";
import ConvertEntityNotification from "ee/pages/common/ConvertEntityNotification";
import { Icon } from "@appsmith/ads";
import { resolveIcon } from "../utils";
import { ENTITY_ICON_SIZE, EntityIcon } from "../Explorer/ExplorerIcons";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { AppPluginActionEditor } from "pages/Editor/AppPluginActionEditor";

type ApiEditorWrapperProps = RouteComponentProps<APIEditorRouteParams>;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPageName(pages: any, basePageId: string) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = pages.find((page: any) => page.basePageId === basePageId);

  return page ? page.pageName : "";
}

function ApiEditorWrapper(props: ApiEditorWrapperProps) {
  const { baseApiId = "", basePageId } = props.match.params;
  const dispatch = useDispatch();
  const isEditorInitialized = useSelector(getIsEditorInitialized);
  const action = useSelector((state) => getActionByBaseId(state, baseApiId));
  const apiName = action?.name || "";
  const pluginId = get(action, "pluginId", "");
  const datasourceId = action?.datasource.id || "";
  const plugins = useSelector(getPlugins);
  const pages = useSelector(getPageList);
  const pageName = getPageName(pages, basePageId);
  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isConverting = useSelector((state) =>
    getIsActionConverting(state, action?.id || ""),
  );
  const editorMode = useSelector(getIDEViewMode);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = resolveIcon({
    iconLocation: pluginGroups[pluginId]?.iconLocation || "",
    pluginType: action?.pluginType || "",
    moduleType: action?.actionConfiguration?.body?.moduleType,
  }) || (
    <EntityIcon
      height={`${ENTITY_ICON_SIZE}px`}
      width={`${ENTITY_ICON_SIZE}px`}
    >
      <Icon name="module" />
    </EntityIcon>
  );

  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );
  const isCreatePermitted = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const moreActionsMenu = useMemo(() => {
    const convertToModuleProps = {
      canCreateModuleInstance: isCreatePermitted,
      canDeleteEntity: isDeletePermitted,
      entityId: action?.id || "",
      moduleType: MODULE_TYPE.QUERY,
    };

    return (
      <>
        <MoreActionsMenu
          basePageId={basePageId}
          className="t--more-action-menu"
          id={action?.id || ""}
          isChangePermitted={isChangePermitted}
          isDeletePermitted={isDeletePermitted}
          name={action?.name || ""}
          prefixAdditionalMenus={
            editorMode === EditorViewMode.SplitScreen && (
              <ConvertToModuleInstanceCTA {...convertToModuleProps} />
            )
          }
        />
        {editorMode !== EditorViewMode.SplitScreen && (
          <ConvertToModuleInstanceCTA {...convertToModuleProps} />
        )}
      </>
    );
  }, [
    action?.id,
    action?.name,
    isChangePermitted,
    isDeletePermitted,
    basePageId,
    isCreatePermitted,
    editorMode,
  ]);

  const handleRunClick = useCallback(
    (paginationField?: PaginationField) => {
      const pluginName = plugins.find((plugin) => plugin.id === pluginId)?.name;

      AnalyticsUtil.logEvent("RUN_API_CLICK", {
        apiName,
        apiID: action?.id,
        pageName: pageName,
        datasourceId,
        pluginName: pluginName,
        isMock: false, // as mock db exists only for postgres and mongo plugins
      });
      dispatch(runAction(action?.id ?? "", paginationField));
    },
    [action?.id, apiName, pageName, plugins, pluginId, datasourceId, dispatch],
  );

  const actionRightPaneBackLink = useMemo(() => {
    return <BackToCanvas basePageId={basePageId} />;
  }, [basePageId]);

  const handleDeleteClick = useCallback(() => {
    AnalyticsUtil.logEvent("DELETE_API_CLICK", {
      apiName,
      apiID: action?.id,
      pageName,
    });
    dispatch(deleteAction({ id: action?.id ?? "", name: apiName }));
  }, [pages, basePageId, apiName, action?.id, dispatch, pageName]);

  const notification = useMemo(() => {
    if (!isConverting) return null;

    return <ConvertEntityNotification icon={icon} name={action?.name || ""} />;
  }, [action?.name, isConverting, icon]);

  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  if (isActionRedesignEnabled) {
    return <AppPluginActionEditor />;
  }

  return (
    <ApiEditorContextProvider
      actionRightPaneBackLink={actionRightPaneBackLink}
      handleDeleteClick={handleDeleteClick}
      handleRunClick={handleRunClick}
      moreActionsMenu={moreActionsMenu}
      notification={notification}
      saveActionName={saveActionName}
      settingsConfig={settingsConfig}
    >
      <Disabler isDisabled={isConverting}>
        <Editor {...props} isEditorInitialized={isEditorInitialized} />
      </Disabler>
    </ApiEditorContextProvider>
  );
}

export default ApiEditorWrapper;
