import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import { CloseDebugger } from "components/editorComponents/Debugger/DebuggerTabs";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import React, { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import {
  getDebuggerSelectedTab,
  getErrorCount,
  getResponsePaneHeight,
} from "selectors/debuggerSelectors";
import { Text, TextType } from "design-system-old";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import Resizable, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import {
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  INSPECT_ENTITY,
  createMessage,
} from "@appsmith/constants/messages";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import { Callout, SegmentedControl } from "design-system";
import {
  NoResponse,
  ResponseTabErrorContainer,
  ResponseTabErrorContent,
  ResponseTabErrorDefaultMessage,
  apiReactJsonProps,
  responseTabComponent,
} from "components/editorComponents/ApiResponseView";
import LogAdditionalInfo from "components/editorComponents/Debugger/ErrorLogs/components/LogAdditionalInfo";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";
import { JsonWrapper } from "components/editorComponents/Debugger/ErrorLogs/components/LogCollapseData";
import ReactJson from "react-json-view";
import EntityDeps from "components/editorComponents/Debugger/EntityDependecies";
import type { ActionResponse } from "api/ActionAPI";
import { getErrorAsString } from "sagas/ActionExecution/errorUtils";
import { isString } from "lodash";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { SourceEntity } from "entities/AppsmithConsole";
import { getUpdateTimestamp } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import type { Action } from "entities/Action";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";

const HelpSection = styled.div``;

const ResponseContentWrapper = styled.div<{ isError: boolean }>`
  overflow-y: clip;
  display: grid;
  height: ${(props) => (props.isError ? "" : "100%")};

  ${HelpSection} {
    margin-bottom: 10px;
  }
`;

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

interface QueryResponseViewProps {
  actionSource: SourceEntity;
  responseTabOnRunClick: () => void;
  currentActionConfig?: Action;
  isRunning: boolean;
  actionName: string; // Check what and how to get
  runErrorMessage?: string;
  actionResponse?: ActionResponse;
  responseDataTypes: { key: string; title: string }[];
  responseDisplayFormat: { title: string; value: string };
  isExecutePermitted: boolean;
}

function QueryResponseView({
  actionName,
  actionResponse,
  actionSource,
  currentActionConfig,
  isExecutePermitted,
  isRunning,
  responseDataTypes,
  responseDisplayFormat,
  responseTabOnRunClick,
  runErrorMessage,
}: QueryResponseViewProps) {
  let output: Record<string, any>[] | null = null;

  const responseBodyTabs =
    responseDataTypes &&
    responseDataTypes.map((dataType, index) => {
      return {
        index: index,
        key: dataType.key,
        title: dataType.title,
        panelComponent: responseTabComponent(
          dataType.key,
          output,
          responsePaneHeight,
        ),
      };
    });

  const segmentedControlOptions =
    responseBodyTabs &&
    responseBodyTabs.map((item) => {
      return { value: item.key, label: item.title };
    });

  const panelRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const [selectedControl, setSelectedControl] = useState(
    segmentedControlOptions[0]?.value,
  );
  const selectedResponseTab = useSelector(getDebuggerSelectedTab);
  const responsePaneHeight = useSelector(getResponsePaneHeight);
  const errorCount = useSelector(getErrorCount);

  const onResponseTabSelect = (tabKey: string) => {
    if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "QUERY_PANE",
      });
    }
    dispatch(
      setActionResponseDisplayFormat({
        id: currentActionConfig?.id || "",
        field: "responseDisplayFormat",
        value: tabKey,
      }),
    );
  };

  let error = runErrorMessage;
  let hintMessages: Array<string> = [];
  // Update request timestamp to human readable format.
  const responseState =
    actionResponse && getUpdateTimestamp(actionResponse.request);

  const selectedTabIndex =
    responseDataTypes &&
    responseDataTypes.findIndex(
      (dataType) => dataType.title === responseDisplayFormat?.title,
    );

  // Query is executed even once during the session, show the response data.
  if (actionResponse) {
    if (!actionResponse.isExecutionSuccess) {
      // Pass the error to be shown in the error tab
      error = actionResponse.readableError
        ? getErrorAsString(actionResponse.readableError)
        : getErrorAsString(actionResponse.body);
    } else if (isString(actionResponse.body)) {
      //reset error.
      error = "";
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
      //reset error.
      error = "";
      output = actionResponse.body as any;
    }
    if (actionResponse.messages && actionResponse.messages.length) {
      //reset error.
      error = "";
      hintMessages = actionResponse.messages;
    }
  }

  const setQueryResponsePaneHeight = useCallback((height: number) => {
    dispatch(setResponsePaneHeight(height));
  }, []);

  const onClose = () => dispatch(showDebugger(false));
  const setSelectedResponseTab = useCallback((tabKey: string) => {
    dispatch(setDebuggerSelectedTab(tabKey));
  }, []);

  const responseTabs = [
    {
      key: "response",
      title: "Response",
      panelComponent: (
        <ResponseContentWrapper isError={!!error}>
          {error && (
            <ResponseTabErrorContainer>
              <ResponseTabErrorContent>
                <ResponseTabErrorDefaultMessage>
                  Your query failed to execute
                  {actionResponse &&
                    (actionResponse.pluginErrorDetails ||
                      actionResponse.body) &&
                    ":"}
                </ResponseTabErrorDefaultMessage>
                {actionResponse &&
                  (actionResponse.pluginErrorDetails ? (
                    <>
                      <div data-testid="t--query-error">
                        {actionResponse.pluginErrorDetails
                          .downstreamErrorMessage ||
                          actionResponse.pluginErrorDetails
                            .appsmithErrorMessage}
                      </div>
                      {actionResponse.pluginErrorDetails
                        .downstreamErrorCode && (
                        <LogAdditionalInfo
                          text={
                            actionResponse.pluginErrorDetails
                              .downstreamErrorCode
                          }
                        />
                      )}
                    </>
                  ) : (
                    actionResponse.body && (
                      <div data-testid="t--query-error">
                        {actionResponse.body}
                      </div>
                    )
                  ))}
                <LogHelper
                  logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
                  name="PluginExecutionError"
                  pluginErrorDetails={
                    actionResponse && actionResponse.pluginErrorDetails
                  }
                  source={actionSource}
                />
              </ResponseTabErrorContent>
              {actionResponse && actionResponse.request && (
                <JsonWrapper
                  className="t--debugger-log-state"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReactJson src={responseState} {...apiReactJsonProps} />
                </JsonWrapper>
              )}
            </ResponseTabErrorContainer>
          )}
          {hintMessages && hintMessages.length > 0 && (
            <HelpSection>
              {hintMessages.map((msg, index) => (
                <Callout key={index} kind="warning">
                  {msg}
                </Callout>
              ))}
            </HelpSection>
          )}
          {currentActionConfig &&
            output &&
            responseBodyTabs &&
            responseBodyTabs.length > 0 &&
            selectedTabIndex !== -1 && (
              <SegmentedControlContainer>
                <SegmentedControl
                  data-testid="t--response-tab-segmented-control"
                  defaultValue={segmentedControlOptions[0]?.value}
                  isFullWidth={false}
                  onChange={(value) => {
                    setSelectedControl(value);
                    onResponseTabSelect(value);
                  }}
                  options={segmentedControlOptions}
                  value={selectedControl}
                />
                {responseTabComponent(
                  selectedControl || segmentedControlOptions[0]?.value,
                  output,
                  responsePaneHeight,
                )}
              </SegmentedControlContainer>
            )}
          {!output && !error && (
            <NoResponse
              isButtonDisabled={!isExecutePermitted}
              isQueryRunning={isRunning}
              onRunClick={responseTabOnRunClick}
            />
          )}
        </ResponseContentWrapper>
      ),
    },
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
      {isRunning && (
        <ActionExecutionInProgressView
          actionType="query"
          theme={EditorTheme.LIGHT}
        />
      )}

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

export default QueryResponseView;
