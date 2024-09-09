import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import Editor from "./Editor";
import history from "utils/history";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import BackToCanvas from "components/common/BackToCanvas";
import { INTEGRATION_TABS } from "constants/routes";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  getPagePermissions,
} from "selectors/editorSelectors";
import { changeQuery } from "actions/queryPaneActions";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import {
  getActionByBaseId,
  getIsActionConverting,
  getPluginImages,
  getPluginSettingConfigs,
} from "ee/selectors/entitiesSelector";
import { integrationEditorURL } from "ee/RouteBuilder";
import { QueryEditorContextProvider } from "./QueryEditorContext";
import type { QueryEditorRouteParams } from "constants/routes";
import {
  getHasCreateActionPermission,
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import Disabler from "pages/common/Disabler";
import ConvertToModuleInstanceCTA from "ee/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";
import { MODULE_TYPE } from "ee/constants/ModuleConstants";
import ConvertEntityNotification from "ee/pages/common/ConvertEntityNotification";
import { PluginType } from "entities/Action";
import { Icon } from "@appsmith/ads";
import { resolveIcon } from "../utils";
import { ENTITY_ICON_SIZE, EntityIcon } from "../Explorer/ExplorerIcons";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { AppPluginActionEditor } from "../AppPluginActionEditor";

type QueryEditorProps = RouteComponentProps<QueryEditorRouteParams>;

function QueryEditor(props: QueryEditorProps) {
  const { baseApiId, basePageId, baseQueryId } = props.match.params;
  const baseActionId = baseQueryId || baseApiId;
  const dispatch = useDispatch();
  const action = useSelector((state) =>
    getActionByBaseId(state, baseActionId || ""),
  );
  const pluginId = action?.pluginId || "";
  const isEditorInitialized = useSelector(getIsEditorInitialized);
  const applicationId: string = useSelector(getCurrentApplicationId);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );
  const pagePermissions = useSelector(getPagePermissions);
  const isConverting = useSelector((state) =>
    getIsActionConverting(state, action?.id || ""),
  );
  const pluginImages = useSelector(getPluginImages);
  const editorMode = useSelector(getIDEViewMode);
  const icon = resolveIcon({
    iconLocation: pluginImages[pluginId] || "",
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

  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );

  const isChangePermitted = getHasManageActionPermission(
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
        {action?.pluginType !== PluginType.INTERNAL &&
          editorMode !== EditorViewMode.SplitScreen && (
            // Need to remove this check once workflow query is supported in module
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

  const actionRightPaneBackLink = useMemo(() => {
    return <BackToCanvas basePageId={basePageId} />;
  }, [basePageId]);

  const changeQueryPage = useCallback(
    (baseQueryId: string) => {
      dispatch(
        changeQuery({ baseQueryId: baseQueryId, basePageId, applicationId }),
      );
    },
    [basePageId, applicationId],
  );

  const onCreateDatasourceClick = useCallback(() => {
    history.push(
      integrationEditorURL({
        basePageId: basePageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
    // Event for datasource creation click
    const entryPoint = DatasourceCreateEntryPoints.QUERY_EDITOR;
    AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
      entryPoint,
    });
  }, [
    basePageId,
    history,
    integrationEditorURL,
    DatasourceCreateEntryPoints,
    AnalyticsUtil,
  ]);

  // custom function to return user to integrations page if action is not found
  const onEntityNotFoundBackClick = useCallback(
    () =>
      history.push(
        integrationEditorURL({
          basePageId: basePageId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      ),
    [basePageId, history, integrationEditorURL],
  );

  const notification = useMemo(() => {
    if (!isConverting) return null;

    return (
      <ConvertEntityNotification
        icon={icon}
        name={action?.name || ""}
        withPadding
      />
    );
  }, [action?.name, isConverting]);

  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  if (isActionRedesignEnabled) {
    return <AppPluginActionEditor />;
  }

  return (
    <QueryEditorContextProvider
      actionRightPaneBackLink={actionRightPaneBackLink}
      changeQueryPage={changeQueryPage}
      moreActionsMenu={moreActionsMenu}
      notification={notification}
      onCreateDatasourceClick={onCreateDatasourceClick}
      onEntityNotFoundBackClick={onEntityNotFoundBackClick}
    >
      <Disabler isDisabled={isConverting}>
        <Editor
          {...props}
          isEditorInitialized={isEditorInitialized}
          settingsConfig={settingsConfig}
        />
      </Disabler>
    </QueryEditorContextProvider>
  );
}

export default QueryEditor;
