import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import Editor from "pages/Editor/QueryEditor/Editor";
import {
  changeQuery,
  setQueryPaneConfigSelectedTabIndex,
} from "actions/queryPaneActions";
import { QueryEditorContextProvider } from "pages/Editor/QueryEditor/QueryEditorContext";
import {
  getAction,
  getPluginSettingConfigs,
} from "@appsmith/selectors/entitiesSelector";
import { noop } from "lodash";
import ActionEditorContextMenu from "../ModuleEditor/ActionEditorContextMenu";
import CloseEditor from "components/editorComponents/CloseEditor";
import history from "utils/history";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { INTEGRATION_TABS } from "constants/routes";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getIsWorkflowEditorInitialized } from "@appsmith/selectors/workflowSelectors";

interface WorkflowQueryEditorRouteParams {
  pageId: string; // TODO: @ashit remove this and add generic key in the Editor
  workflowId: string;
  queryId?: string;
  apiId?: string;
}

type WorkflowQueryEditorProps =
  RouteComponentProps<WorkflowQueryEditorRouteParams>;

function WorkflowQueryEditor(props: WorkflowQueryEditorProps) {
  const dispatch = useDispatch();
  const { apiId, queryId, workflowId } = props.match.params;

  const isWorkflowEditorInitialized = useSelector(
    getIsWorkflowEditorInitialized,
  );

  const actionId = queryId || apiId || "";
  const action = useSelector((state) => getAction(state, actionId));

  const pluginId = action?.pluginId || "";
  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );

  useEffect(() => {
    /**
     * This is a hack to set the "Query" tab of the query editor.
     * Reason for hack:
     * 1. In the queryPaneReducer the selectedConfigTabIndex is "0" instead of 0 which makes the condition
     *  selectedConfigTab || EDITOR_TABS.QUERY in EditorJSONtoForm.tsx and nothing get's pre selected.
     * 2. This problem does not occur in App Editor because the contextSwitchingSaga force resets the
     *  selectedConfigTabIndex from "0" to 0 making the above condition work. The logic for context switch is
     *  currently not enabled for package editor.
     *
     * Until the above to problems are resolved then hack will work as a stop gap
     */
    dispatch(setQueryPaneConfigSelectedTabIndex(0 as any));
  }, []);

  const changeQueryPage = useCallback(
    (queryId: string) => {
      dispatch(changeQuery({ id: queryId, workflowId }));
    },
    [workflowId],
  );

  const onCreateDatasourceClick = useCallback(() => {
    history.push(
      integrationEditorURL({
        workflowId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
    // Event for datasource creation click
    const entryPoint = DatasourceCreateEntryPoints.QUERY_EDITOR;
    AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
      entryPoint,
    });
  }, [
    workflowId,
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
          workflowId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      ),
    [workflowId, history, integrationEditorURL],
  );

  const moreActionsMenu = useMemo(() => {
    return <ActionEditorContextMenu isDeletePermitted onDelete={noop} />;
  }, []);

  const closeEditorLink = useMemo(() => <CloseEditor />, []);

  return (
    <QueryEditorContextProvider
      changeQueryPage={changeQueryPage}
      closeEditorLink={closeEditorLink}
      moreActionsMenu={moreActionsMenu}
      onCreateDatasourceClick={onCreateDatasourceClick}
      onEntityNotFoundBackClick={onEntityNotFoundBackClick}
    >
      <Editor
        {...props}
        isEditorInitialized={isWorkflowEditorInitialized}
        settingsConfig={settingsConfig}
      />
    </QueryEditorContextProvider>
  );
}

export default WorkflowQueryEditor;
