import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import {
  getIsActionConverting,
  getPageList,
  getPluginSettingConfigs,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import { deleteAction, runAction } from "actions/pluginActionActions";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import Editor from "./Editor";
import BackToCanvas from "components/common/BackToCanvas";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import {
  getIsEditorInitialized,
  getPagePermissions,
} from "selectors/editorSelectors";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import type { APIEditorRouteParams } from "constants/routes";
import {
  getHasCreateActionPermission,
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { ApiEditorContextProvider } from "./ApiEditorContext";
import type { PaginationField } from "api/ActionAPI";
import { get, keyBy } from "lodash";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import ConvertToModuleInstanceCTA from "@appsmith/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import Disabler from "pages/common/Disabler";
import ConvertEntityNotification from "@appsmith/pages/common/ConvertEntityNotification";
import { Icon } from "design-system";
import { resolveIcon } from "../utils";
import { ENTITY_ICON_SIZE, EntityIcon } from "../Explorer/ExplorerIcons";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";

type ApiEditorWrapperProps = RouteComponentProps<APIEditorRouteParams>;

function getPageName(pages: any, pageId: string) {
  const page = pages.find((page: any) => page.pageId === pageId);
  return page ? page.pageName : "";
}

function ApiEditorWrapper(props: ApiEditorWrapperProps) {
  const { apiId = "", pageId } = props.match.params;
  const dispatch = useDispatch();
  const isEditorInitialized = useSelector(getIsEditorInitialized);
  const action = useSelector((state) => getAction(state, apiId));
  const apiName = action?.name || "";
  const pluginId = get(action, "pluginId", "");
  const datasourceId = action?.datasource.id || "";
  const plugins = useSelector(getPlugins);
  const pages = useSelector(getPageList);
  const pageName = getPageName(pages, pageId);
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
          className="t--more-action-menu"
          id={action?.id || ""}
          isChangePermitted={isChangePermitted}
          isDeletePermitted={isDeletePermitted}
          name={action?.name || ""}
          pageId={pageId}
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
    pageId,
    isCreatePermitted,
    editorMode,
  ]);

  const handleRunClick = useCallback(
    (paginationField?: PaginationField) => {
      const pluginName = plugins.find((plugin) => plugin.id === pluginId)?.name;
      PerformanceTracker.startTracking(
        PerformanceTransactionName.RUN_API_CLICK,
        {
          apiId,
        },
      );
      AnalyticsUtil.logEvent("RUN_API_CLICK", {
        apiName,
        apiID: apiId,
        pageName: pageName,
        datasourceId,
        pluginName: pluginName,
        isMock: false, // as mock db exists only for postgres and mongo plugins
      });
      dispatch(runAction(apiId, paginationField));
    },
    [apiId, apiName, pageName, getPageName, plugins, pluginId, datasourceId],
  );

  const actionRightPaneBackLink = useMemo(() => {
    return <BackToCanvas pageId={pageId} />;
  }, [pageId]);

  const handleDeleteClick = useCallback(() => {
    AnalyticsUtil.logEvent("DELETE_API_CLICK", {
      apiName,
      apiID: apiId,
      pageName,
    });
    dispatch(deleteAction({ id: apiId, name: apiName }));
  }, [getPageName, pages, pageId, apiName]);

  const notification = useMemo(() => {
    if (!isConverting) return null;

    return <ConvertEntityNotification icon={icon} name={action?.name || ""} />;
  }, [action?.name, isConverting]);

  return (
    <ApiEditorContextProvider
      actionRightPaneBackLink={actionRightPaneBackLink}
      handleDeleteClick={handleDeleteClick}
      handleRunClick={handleRunClick}
      moreActionsMenu={moreActionsMenu}
      notification={notification}
      settingsConfig={settingsConfig}
    >
      <Disabler isDisabled={isConverting}>
        <Editor {...props} isEditorInitialized={isEditorInitialized} />
      </Disabler>
    </ApiEditorContextProvider>
  );
}

export default ApiEditorWrapper;
