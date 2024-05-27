import type { BottomTab } from "components/editorComponents/EntityBottomTabs";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { getErrorCount } from "selectors/debuggerSelectors";
import { Text, TextType } from "design-system-old";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import {
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  DEBUGGER_RESPONSE,
  createMessage,
} from "@appsmith/constants/messages";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import Schema from "components/editorComponents/Debugger/Schema";
import type { ActionResponse } from "api/ActionAPI";
import { isString } from "lodash";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { Action } from "entities/Action";
import QueryResponseTab from "./QueryResponseTab";
import {
  getDatasourceStructureById,
  getPluginDatasourceComponentFromId,
} from "@appsmith/selectors/entitiesSelector";
import { DatasourceComponentTypes } from "api/PluginApi";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import { DatasourceStructureContext } from "entities/Datasource";
import { getQueryPaneDebuggerState } from "selectors/queryPaneSelectors";
import { setQueryPaneDebuggerState } from "actions/queryPaneActions";
import { actionResponseDisplayDataFormats } from "../utils";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { IDEBottomView, ViewHideBehaviour } from "../../../IDE";

const ResultsCount = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[17] + 1}px;
  top: 9px;
  color: var(--ads-v2-color-fg);
`;

interface QueryDebuggerTabsProps {
  actionSource: SourceEntity;
  currentActionConfig?: Action;
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
  isRunning,
  onRunClick,
  runErrorMessage,
  showSchema,
}: QueryDebuggerTabsProps) {
  let output: Record<string, any>[] | null = null;
  const dispatch = useDispatch();

  const { open, responseTabHeight, selectedTab } = useSelector(
    getQueryPaneDebuggerState,
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
  }, []);

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
        setQueryPaneDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        }),
      );
      setShowResponseOnFirstLoad(true);
    }
  }, [responseDisplayFormat, actionResponse, showResponseOnFirstLoad]);

  useEffect(() => {
    if (showSchema && !selectedTab) {
      dispatch(
        setQueryPaneDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.SCHEMA_TAB,
        }),
      );
    }
  }, [showSchema, currentActionConfig?.id, selectedTab]);

  // When multiple page load queries exist, we want to response tab by default for all of them
  // Hence this useEffect will reset showResponseOnFirstLoad flag used to track whether to show response tab or not
  useEffect(() => {
    if (!!currentActionConfig?.id) {
      setShowResponseOnFirstLoad(false);
    }
  }, [currentActionConfig?.id]);

  // Query is executed even once during the session, show the response data.
  if (actionResponse) {
    if (isString(actionResponse.body)) {
      try {
        // Try to parse response as JSON array to be displayed in the Response tab
        output = JSON.parse(actionResponse.body);
      } catch (e) {
        // In case the string is not a JSON, wrap it in a response object
        output = [
          {
            response: actionResponse.body,
          },
        ];
      }
    } else {
      output = actionResponse.body as any;
    }
  }

  const setQueryResponsePaneHeight = useCallback((height: number) => {
    dispatch(setQueryPaneDebuggerState({ responseTabHeight: height }));
  }, []);

  const onToggle = useCallback(() => {
    dispatch(setQueryPaneDebuggerState({ open: !open }));
  }, [open]);

  const setSelectedResponseTab = useCallback((tabKey: string) => {
    dispatch(setQueryPaneDebuggerState({ open: true, selectedTab: tabKey }));
  }, []);

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
      key: "response",
      title: createMessage(DEBUGGER_RESPONSE),
      panelComponent: (
        <QueryResponseTab
          actionSource={actionSource}
          currentActionConfig={currentActionConfig}
          isRunning={isRunning}
          onRunClick={onRunClick}
          runErrorMessage={runErrorMessage}
        />
      ),
    });
  }

  if (showSchema && currentActionConfig && currentActionConfig.datasource) {
    responseTabs.unshift({
      key: "schema",
      title: "Schema",
      panelComponent: (
        <Schema
          currentActionId={currentActionConfig.id}
          datasourceId={currentActionConfig.datasource.id || ""}
          datasourceName={currentActionConfig.datasource.name || ""}
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
      {output && !!output.length && (
        <ResultsCount>
          <Text type={TextType.P3}>
            Result:
            <Text type={TextType.H5}>{` ${output.length} Record${
              output.length > 1 ? "s" : ""
            }`}</Text>
          </Text>
        </ResultsCount>
      )}

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
