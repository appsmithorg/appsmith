import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import { CloseDebugger } from "components/editorComponents/Debugger/DebuggerTabs";
import type { BottomTab } from "components/editorComponents/EntityBottomTabs";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import React, { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import {
  getDebuggerSelectedTab,
  getErrorCount,
  getResponsePaneHeight,
} from "selectors/debuggerSelectors";
import { Text, TextType } from "design-system-old";
import Resizable, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import {
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  INSPECT_ENTITY,
  createMessage,
} from "@appsmith/constants/messages";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import EntityDeps from "components/editorComponents/Debugger/EntityDependecies";
import Schema from "components/editorComponents/Debugger/Schema";
import type { ActionResponse } from "api/ActionAPI";
import { isString } from "lodash";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { Action } from "entities/Action";
import QueryResponseTab from "./QueryResponseTab";

const ResultsCount = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[17] + 1}px;
  top: 9px;
  color: var(--ads-v2-color-fg);
`;

export const TabbedViewContainer = styled.div`
  ${ResizerCSS};
  height: ${ActionExecutionResizerHeight}px;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  width: 100%;
  background-color: var(--ads-v2-color-bg);
  border-top: 1px solid var(--ads-v2-color-border);
`;

export const SegmentedControlContainer = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
  padding-top: var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  overflow-y: clip;
  overflow-x: scroll;
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

  const panelRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const selectedResponseTab = useSelector(getDebuggerSelectedTab);
  const responsePaneHeight = useSelector(getResponsePaneHeight);
  const errorCount = useSelector(getErrorCount);

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
    dispatch(setResponsePaneHeight(height));
  }, []);

  const onClose = () => dispatch(showDebugger(false));
  const setSelectedResponseTab = useCallback((tabKey: string) => {
    dispatch(setDebuggerSelectedTab(tabKey));
  }, []);

  const responseTabs: BottomTab[] = [
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
    {
      key: DEBUGGER_TAB_KEYS.INSPECT_TAB,
      title: createMessage(INSPECT_ENTITY),
      panelComponent: <EntityDeps />,
    },
  ];

  if (currentActionConfig) {
    responseTabs.unshift({
      key: "response",
      title: "Response",
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

  if (showSchema && currentActionConfig) {
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
    <TabbedViewContainer
      className="t--query-bottom-pane-container"
      ref={panelRef}
    >
      <Resizable
        initialHeight={responsePaneHeight}
        onResizeComplete={(height: number) =>
          setQueryResponsePaneHeight(height)
        }
        openResizer={isRunning}
        panelRef={panelRef}
        snapToHeight={ActionExecutionResizerHeight}
      />

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
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        onSelect={setSelectedResponseTab}
        selectedTabKey={selectedResponseTab}
        tabs={responseTabs}
      />
      <CloseDebugger
        className="close-debugger t--close-debugger"
        isIconButton
        kind="tertiary"
        onClick={onClose}
        size="md"
        startIcon="close-modal"
      />
    </TabbedViewContainer>
  );
}

export default QueryDebuggerTabs;
