import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import {
  getPageList,
  getPluginSettingConfigs,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import { deleteAction, runAction } from "actions/pluginActionActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Editor from "./Editor";
import BackToCanvas from "components/common/BackToCanvas";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import type { APIEditorRouteParams } from "constants/routes";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { ApiEditorContextProvider } from "./ApiEditorContext";
import type { PaginationField } from "api/ActionAPI";
import { get } from "lodash";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import CloseEditor from "components/editorComponents/CloseEditor";

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
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );

  const moreActionsMenu = useMemo(
    () => (
      <MoreActionsMenu
        className="t--more-action-menu"
        id={action ? action.id : ""}
        isChangePermitted={isChangePermitted}
        isDeletePermitted={isDeletePermitted}
        name={action ? action.name : ""}
        pageId={pageId}
      />
    ),
    [action?.id, action?.name, isChangePermitted, isDeletePermitted, pageId],
  );

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

  const isPagesPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_new_sidebar_pages_pane_enabled,
  );

  const closeEditorLink = useMemo(() => <CloseEditor />, []);

  return (
    <ApiEditorContextProvider
      actionRightPaneBackLink={actionRightPaneBackLink}
      closeEditorLink={isPagesPaneEnabled ? null : closeEditorLink}
      handleDeleteClick={handleDeleteClick}
      handleRunClick={handleRunClick}
      moreActionsMenu={moreActionsMenu}
      settingsConfig={settingsConfig}
    >
      <Editor {...props} isEditorInitialized={isEditorInitialized} />
    </ApiEditorContextProvider>
  );
}

export default ApiEditorWrapper;
