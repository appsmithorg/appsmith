import type { BottomTab } from "components/editorComponents/EntityBottomTabs";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getErrorCount } from "selectors/debuggerSelectors";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import {
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  DEBUGGER_RESPONSE,
  createMessage,
} from "ee/constants/messages";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import { Datasource } from "PluginActionEditor/components/PluginActionResponse/components/DatasourceTab";
import type { ActionResponse } from "api/ActionAPI";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { Action } from "entities/Action";
import QueryResponseTab from "PluginActionEditor/components/PluginActionResponse/components/QueryResponseTab";
import {
  getDatasource,
  getDatasourceStructureById,
  getPluginDatasourceComponentFromId,
} from "ee/selectors/entitiesSelector";
import { DatasourceComponentTypes } from "api/PluginApi";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import { DatasourceStructureContext } from "entities/Datasource";
import {
  getPluginActionDebuggerState,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor/store";
import { actionResponseDisplayDataFormats } from "../utils";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { IDEBottomView, ViewHideBehaviour } from "IDE";

interface QueryDebuggerTabsProps {
  actionSource: SourceEntity;
  currentActionConfig?: Action;
  isRunDisabled?: boolean;
  isRunning: boolean;
  actionName: string; // Check what and how to get
  runErrorMessage?: string;
  actionResponse?: ActionResponse;
  onRunClick: () => void;
  showSchema?: boolean;
}

function QueryDebuggerTabs({
  actionName,
  actionResponse,
  actionSource,
  currentActionConfig,
  isRunDisabled = false,
  isRunning,
  onRunClick,
  runErrorMessage,
  showSchema,
}: QueryDebuggerTabsProps) {
  const dispatch = useDispatch();

  const { open, responseTabHeight, selectedTab } = useSelector(
    getPluginActionDebuggerState,
  );

  const { responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

  const [showResponseOnFirstLoad, setShowResponseOnFirstLoad] =
    useState<boolean>(false);

  const errorCount = useSelector(getErrorCount);

  const pluginDatasourceForm = useSelector((state) =>
    getPluginDatasourceComponentFromId(
      state,
      currentActionConfig?.pluginId || "",
    ),
  );

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(
      state,
      currentActionConfig?.datasource?.id ?? "",
    ),
  );

  const datasource = useSelector((state) =>
    getDatasource(state, currentActionConfig?.datasource?.id ?? ""),
  );

  useEffect(() => {
    if (
      currentActionConfig?.datasource?.id &&
      datasourceStructure === undefined &&
      pluginDatasourceForm !== DatasourceComponentTypes.RestAPIDatasourceForm
    ) {
      dispatch(
        fetchDatasourceStructure(
          currentActionConfig.datasource.id,
          true,
          DatasourceStructureContext.QUERY_EDITOR,
        ),
      );
    }
  }, [
    currentActionConfig,
    datasourceStructure,
    dispatch,
    pluginDatasourceForm,
  ]);

  // These useEffects are used to open the response tab by default for page load queries
  // as for page load queries, query response is available and can be shown in response tab
  useEffect(() => {
    // actionResponse and responseDisplayFormat is present only when query has response available
    if (
      responseDisplayFormat &&
      !!responseDisplayFormat?.title &&
      actionResponse &&
      actionResponse.isExecutionSuccess &&
      !showResponseOnFirstLoad
    ) {
      dispatch(
        setPluginActionEditorDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        }),
      );
      setShowResponseOnFirstLoad(true);
    }
  }, [
    responseDisplayFormat,
    actionResponse,
    showResponseOnFirstLoad,
    dispatch,
  ]);

  useEffect(() => {
    if (showSchema && !selectedTab) {
      dispatch(
        setPluginActionEditorDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.DATASOURCE_TAB,
        }),
      );
    }
  }, [showSchema, selectedTab, dispatch]);

  // When multiple page load queries exist, we want to response tab by default for all of them
  // Hence this useEffect will reset showResponseOnFirstLoad flag used to track whether to show response tab or not
  useEffect(() => {
    if (!!currentActionConfig?.id) {
      setShowResponseOnFirstLoad(false);
    }
  }, [currentActionConfig?.id]);

  const setQueryResponsePaneHeight = useCallback(
    (height: number) => {
      dispatch(
        setPluginActionEditorDebuggerState({ responseTabHeight: height }),
      );
    },
    [dispatch],
  );

  const onToggle = useCallback(() => {
    dispatch(setPluginActionEditorDebuggerState({ open: !open }));
  }, [dispatch, open]);

  const setSelectedResponseTab = useCallback(
    (tabKey: string) => {
      dispatch(
        setPluginActionEditorDebuggerState({ open: true, selectedTab: tabKey }),
      );
    },
    [dispatch],
  );

  const ideViewMode = useSelector(getIDEViewMode);

  const responseTabs: BottomTab[] = [];

  if (ideViewMode === EditorViewMode.FullScreen) {
    responseTabs.push(
      {
        key: DEBUGGER_TAB_KEYS.ERROR_TAB,
        title: createMessage(DEBUGGER_ERRORS),
        count: errorCount,
        panelComponent: <ErrorLogs />,
      },
      {
        key: DEBUGGER_TAB_KEYS.LOGS_TAB,
        title: createMessage(DEBUGGER_LOGS),
        panelComponent: <DebuggerLogs searchQuery={actionName} />,
      },
    );
  }

  if (currentActionConfig) {
    responseTabs.unshift({
      key: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
      title: createMessage(DEBUGGER_RESPONSE),
      panelComponent: (
        <QueryResponseTab
          actionName={actionName}
          actionSource={actionSource}
          currentActionConfig={currentActionConfig}
          isRunDisabled={isRunDisabled}
          isRunning={isRunning}
          onRunClick={onRunClick}
          runErrorMessage={runErrorMessage}
        />
      ),
    });
  }

  if (showSchema && currentActionConfig && currentActionConfig.datasource) {
    responseTabs.unshift({
      key: DEBUGGER_TAB_KEYS.DATASOURCE_TAB,
      title: "Datasource",
      panelComponent: (
        <Datasource
          currentActionId={currentActionConfig.id}
          datasourceId={currentActionConfig.datasource.id || ""}
          datasourceName={datasource?.name || ""}
        />
      ),
    });
  }

  return (
    <IDEBottomView
      behaviour={ViewHideBehaviour.COLLAPSE}
      className="t--query-bottom-pane-container"
      height={responseTabHeight}
      hidden={!open}
      onHideClick={onToggle}
      setHeight={setQueryResponsePaneHeight}
    >
      <EntityBottomTabs
        isCollapsed={!open}
        onSelect={setSelectedResponseTab}
        selectedTabKey={selectedTab || ""}
        tabs={responseTabs}
      />
    </IDEBottomView>
  );
}

export default QueryDebuggerTabs;
