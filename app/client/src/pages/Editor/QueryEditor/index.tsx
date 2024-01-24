import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import AnalyticsUtil from "utils/AnalyticsUtil";
import Editor from "./Editor";
import history from "utils/history";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import BackToCanvas from "components/common/BackToCanvas";
import { INTEGRATION_TABS } from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsEditorInitialized,
  getPagePermissions,
} from "selectors/editorSelectors";
import { changeQuery } from "actions/queryPaneActions";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import {
  getAction,
  getIsActionConverting,
  getPluginSettingConfigs,
} from "@appsmith/selectors/entitiesSelector";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { QueryEditorContextProvider } from "./QueryEditorContext";
import type { QueryEditorRouteParams } from "constants/routes";
import {
  getHasCreateActionPermission,
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import CloseEditor from "components/editorComponents/CloseEditor";
import Disabler from "pages/common/Disabler";
import ConvertToModuleInstanceCTA from "@appsmith/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import ConvertEntityNotification from "@appsmith/pages/common/ConvertEntityNotification";
import { PluginType } from "entities/Action";

type QueryEditorProps = RouteComponentProps<QueryEditorRouteParams>;

function QueryEditor(props: QueryEditorProps) {
  const { apiId, queryId } = props.match.params;
  const actionId = queryId || apiId;
  const dispatch = useDispatch();
  const action = useSelector((state) => getAction(state, actionId || ""));
  const pluginId = action?.pluginId || "";
  const isEditorInitialized = useSelector(getIsEditorInitialized);
  const applicationId: string = useSelector(getCurrentApplicationId);
  const pageId: string = useSelector(getCurrentPageId);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );
  const pagePermissions = useSelector(getPagePermissions);
  const isConverting = useSelector((state) =>
    getIsActionConverting(state, actionId || ""),
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

  const moreActionsMenu = useMemo(
    () => (
      <>
        <MoreActionsMenu
          className="t--more-action-menu"
          id={action?.id || ""}
          isChangePermitted={isChangePermitted}
          isDeletePermitted={isDeletePermitted}
          name={action?.name || ""}
          pageId={pageId}
        />
        {action?.pluginType !== PluginType.INTERNAL && (
          // Need to remove this check once workflow query is supported in module
          <ConvertToModuleInstanceCTA
            canCreateModuleInstance={isCreatePermitted}
            canDeleteEntity={isDeletePermitted}
            entityId={action?.id || ""}
            moduleType={MODULE_TYPE.QUERY}
          />
        )}
      </>
    ),
    [
      action?.id,
      action?.name,
      isChangePermitted,
      isDeletePermitted,
      pageId,
      isCreatePermitted,
    ],
  );

  const actionRightPaneBackLink = useMemo(() => {
    return <BackToCanvas pageId={pageId} />;
  }, [pageId]);

  const changeQueryPage = useCallback(
    (queryId: string) => {
      dispatch(changeQuery({ id: queryId, pageId, applicationId }));
    },
    [pageId, applicationId],
  );

  const onCreateDatasourceClick = useCallback(() => {
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
    // Event for datasource creation click
    const entryPoint = DatasourceCreateEntryPoints.QUERY_EDITOR;
    AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
      entryPoint,
    });
  }, [
    pageId,
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
          pageId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      ),
    [pageId, history, integrationEditorURL],
  );

  const isPagesPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_new_sidebar_pages_pane_enabled,
  );

  const closeEditorLink = useMemo(() => <CloseEditor />, []);

  const notification = useMemo(() => {
    if (!isConverting) return null;

    return <ConvertEntityNotification name={action?.name || ""} withPadding />;
  }, [action?.name, isConverting]);

  return (
    <QueryEditorContextProvider
      actionRightPaneBackLink={actionRightPaneBackLink}
      changeQueryPage={changeQueryPage}
      closeEditorLink={isPagesPaneEnabled ? null : closeEditorLink}
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
