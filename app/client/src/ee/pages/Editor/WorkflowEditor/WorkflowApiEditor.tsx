import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import Editor from "pages/Editor/APIEditor/Editor";
import {
  getAction,
  getPluginSettingConfigs,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import { get } from "lodash";
import { ApiEditorContextProvider } from "pages/Editor/APIEditor/ApiEditorContext";
import { getIsWorkflowEditorInitialized } from "@appsmith/selectors/workflowSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { PaginationField } from "api/ActionAPI";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ce/entities/FeatureFlag";
import { getHasDeleteActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { deleteAction, runAction } from "actions/pluginActionActions";
import CloseEditor from "components/editorComponents/CloseEditor";
import ActionEditorContextMenu from "../ModuleEditor/ActionEditorContextMenu";
import { saveWorkflowActionName } from "@appsmith/actions/workflowActions";

interface WorkflowApiEditorRouteParams {
  workflowId: string;
  apiId?: string;
}

type WorkflowApiEditorProps = RouteComponentProps<WorkflowApiEditorRouteParams>;

// TODO (Workflows): Remove pageId as dependency of this page, needs API refactor

function WorkflowApiEditor(props: WorkflowApiEditorProps) {
  const { apiId = "" } = props.match.params;
  const action = useSelector((state) => getAction(state, apiId));
  const apiName = action?.name || "";
  const pluginId = get(action, "pluginId", "");
  const datasourceId = action?.datasource.id || "";
  const plugins = useSelector(getPlugins);
  const dispatch = useDispatch();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const isWorkflowEditorInitialized = useSelector(
    getIsWorkflowEditorInitialized,
  );

  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );

  const onDeleteWorkflowAction = useCallback(() => {
    dispatch(deleteAction({ id: action?.id || "", name: action?.name || "" }));
  }, [action?.id]);
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );

  const moreActionsMenu = useMemo(() => {
    return (
      <ActionEditorContextMenu
        isDeletePermitted={isDeletePermitted}
        onDelete={onDeleteWorkflowAction}
      />
    );
  }, []);

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
        datasourceId,
        pluginName: pluginName,
        isMock: false, // as mock db exists only for postgres and mongo plugins
      });
      dispatch(runAction(apiId, paginationField));
    },
    [apiId, apiName, plugins, pluginId, datasourceId],
  );

  const handleDeleteClick = useCallback(() => {
    AnalyticsUtil.logEvent("DELETE_API_CLICK", {
      apiName,
      apiID: apiId,
    });
    dispatch(deleteAction({ id: apiId, name: apiName }));
  }, [apiName]);

  const closeEditorLink = useMemo(() => <CloseEditor />, []);

  const onSaveWorkflowJSActionName = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      return saveWorkflowActionName(id, name);
    },
    [],
  );

  return (
    <ApiEditorContextProvider
      closeEditorLink={closeEditorLink}
      handleDeleteClick={handleDeleteClick}
      handleRunClick={handleRunClick}
      moreActionsMenu={moreActionsMenu}
      saveActionName={onSaveWorkflowJSActionName}
      settingsConfig={settingsConfig}
    >
      <Editor {...props} isEditorInitialized={isWorkflowEditorInitialized} />
    </ApiEditorContextProvider>
  );
}

export default WorkflowApiEditor;
