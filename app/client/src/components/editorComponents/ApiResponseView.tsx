import type { RefObject } from "react";
import React, { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactJson from "react-json-view";
import styled from "styled-components";
import type { ActionResponse } from "api/ActionAPI";
import type { SourceEntity } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { ENTITY_TYPE } from "@appsmith/entities/AppsmithConsole/utils";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { isArray, isEmpty, isString } from "lodash";
import {
  CHECK_REQUEST_BODY,
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_RESPONSE_LAST_HALF,
} from "@appsmith/constants/messages";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import NoResponseSVG from "assets/images/no-response.svg";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { Classes, TAB_MIN_HEIGHT, Text, TextType } from "design-system-old";
import { Button, Callout, Flex, SegmentedControl } from "design-system";
import type { BottomTab } from "./EntityBottomTabs";
import EntityBottomTabs from "./EntityBottomTabs";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import Table from "pages/Editor/QueryEditor/Table";
import { API_RESPONSE_TYPE_OPTIONS } from "constants/ApiEditorConstants/CommonApiConstants";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { isHtml } from "./utils";
import { getErrorCount } from "selectors/debuggerSelectors";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import LogAdditionalInfo from "./Debugger/ErrorLogs/components/LogAdditionalInfo";
import {
  JsonWrapper,
  reactJsonProps,
} from "./Debugger/ErrorLogs/components/LogCollapseData";
import LogHelper from "./Debugger/ErrorLogs/components/LogHelper";
import { getUpdateTimestamp } from "./Debugger/ErrorLogs/ErrorLogItem";
import type { Action } from "entities/Action";
import { SegmentedControlContainer } from "../../pages/Editor/QueryEditor/EditorJSONtoForm";
import ActionExecutionInProgressView from "./ActionExecutionInProgressView";
import { CloseDebugger } from "./Debugger/DebuggerTabs";
import { EMPTY_RESPONSE } from "./emptyResponse";
import { setApiPaneDebuggerState } from "actions/apiPaneActions";
import { getApiPaneDebuggerState } from "selectors/apiPaneSelectors";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import ApiResponseMeta from "./ApiResponseMeta";

const ResponseContainer = styled.div`
  ${ResizerCSS};
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  background-color: var(--ads-v2-color-bg);
  border-top: 1px solid var(--ads-v2-color-border);
  .CodeMirror-code {
    font-size: 12px;
  }
`;

const ResponseTabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  &.t--headers-tab {
    padding-left: var(--ads-v2-spaces-7);
    padding-right: var(--ads-v2-spaces-7);
  }
`;

const TabbedViewWrapper = styled.div`
  height: 100%;
  &&& {
    ul.ads-v2-tabs__list {
      margin: 0 ${(props) => props.theme.spaces[11]}px;
      height: ${TAB_MIN_HEIGHT};
    }
  }

  & {
    .ads-v2-tabs__list {
      padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-7);
    }
  }

  & {
    .ads-v2-tabs__panel {
      height: calc(100% - ${TAB_MIN_HEIGHT});
    }
  }
`;

const NoResponseContainer = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  .${Classes.ICON} {
    margin-right: 0;
    svg {
      width: 150px;
      height: 150px;
    }
  }

  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }
`;

const HelpSection = styled.div`
  padding-bottom: 5px;
  padding-top: 10px;
`;

const ResponseBodyContainer = styled.div`
  overflow-y: clip;
  height: 100%;
  display: grid;
`;

interface Props {
  currentActionConfig?: Action;
  theme?: EditorTheme;
  apiName: string;
  disabled?: boolean;
  onRunClick: () => void;
  responseDataTypes: { key: string; title: string }[];
  responseDisplayFormat: { title: string; value: string };
  actionResponse?: ActionResponse;
  isRunning: boolean;
}

const ResponseDataContainer = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  & .CodeEditorTarget {
    overflow: hidden;
  }
`;

export const ResponseTabErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  gap: 8px;
  height: fit-content;
  background: var(--ads-v2-color-bg-error);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

export const ResponseTabErrorContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
`;

export const ResponseTabErrorDefaultMessage = styled.div`
  flex-shrink: 0;
`;

export const apiReactJsonProps = { ...reactJsonProps, collapsed: 0 };

export const responseTabComponent = (
  responseType: string,
  output: any,
  tableBodyHeight?: number,
): JSX.Element => {
  return {
    [API_RESPONSE_TYPE_OPTIONS.JSON]: (
      <ReadOnlyEditor
        folding
        height={"100%"}
        input={{
          value: isString(output) ? output : JSON.stringify(output, null, 2),
        }}
      />
    ),
    [API_RESPONSE_TYPE_OPTIONS.TABLE]: (
      <Table data={output} tableBodyHeight={tableBodyHeight} />
    ),
    [API_RESPONSE_TYPE_OPTIONS.RAW]: (
      <ReadOnlyEditor
        folding
        height={"100%"}
        input={{
          value: isString(output) ? output : JSON.stringify(output, null, 2),
        }}
        isRawView
      />
    ),
  }[responseType];
};

const StyledText = styled(Text)`
  &&&& {
    margin-top: 0;
  }
`;

interface NoResponseProps {
  isButtonDisabled: boolean | undefined;
  isQueryRunning: boolean;
  onRunClick: () => void;
}
export const NoResponse = (props: NoResponseProps) => (
  <NoResponseContainer>
    <img alt="no-response-yet" src={NoResponseSVG} />
    <div className="flex gap-2 items-center mt-4">
      <StyledText type={TextType.P1}>{EMPTY_RESPONSE_FIRST_HALF()}</StyledText>
      <Button
        isDisabled={props.isButtonDisabled}
        isLoading={props.isQueryRunning}
        onClick={props.onRunClick}
        size="sm"
      >
        Run
      </Button>
      <StyledText type={TextType.P1}>{EMPTY_RESPONSE_LAST_HALF()}</StyledText>
    </div>
  </NoResponseContainer>
);

function ApiResponseView(props: Props) {
  const {
    actionResponse = EMPTY_RESPONSE,
    currentActionConfig,
    disabled,
    isRunning,
    responseDataTypes,
    responseDisplayFormat,
    theme = EditorTheme.LIGHT,
  } = props;
  const hasFailed = actionResponse.statusCode
    ? actionResponse.statusCode[0] !== "2"
    : false;

  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();
  const errorCount = useSelector(getErrorCount);
  const { open, responseTabHeight, selectedTab } = useSelector(
    getApiPaneDebuggerState,
  );

  const ideViewMode = useSelector(getIDEViewMode);

  const onDebugClick = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "API",
    });
    dispatch(
      setApiPaneDebuggerState({ selectedTab: DEBUGGER_TAB_KEYS.ERROR_TAB }),
    );
  }, []);

  const onRunClick = () => {
    props.onRunClick();
    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "API_PANE",
    });
  };

  const messages = actionResponse?.messages;
  let responseHeaders = {};

  // if no headers are present in the response, use the default body text.
  if (actionResponse.headers) {
    Object.entries(actionResponse.headers).forEach(([key, value]) => {
      if (isArray(value) && value.length < 2)
        return (responseHeaders = {
          ...responseHeaders,
          [key]: value[0],
        });
      return (responseHeaders = {
        ...responseHeaders,
        [key]: value,
      });
    });
  } else {
    // if the response headers is empty show an empty object.
    responseHeaders = {};
  }

  const onResponseTabSelect = (tab: string) => {
    dispatch(
      setActionResponseDisplayFormat({
        id: currentActionConfig?.id || "",
        field: "responseDisplayFormat",
        value: tab,
      }),
    );
  };

  let filteredResponseDataTypes: { key: string; title: string }[] = [
    ...responseDataTypes,
  ];
  if (!!actionResponse.body && !isArray(actionResponse.body)) {
    filteredResponseDataTypes = responseDataTypes.filter(
      (item) => item.key !== API_RESPONSE_TYPE_OPTIONS.TABLE,
    );
    if (responseDisplayFormat.title === API_RESPONSE_TYPE_OPTIONS.TABLE) {
      onResponseTabSelect(filteredResponseDataTypes[0]?.title);
    }
  }

  const responseTabs =
    filteredResponseDataTypes &&
    filteredResponseDataTypes.map((dataType, index) => {
      return {
        index: index,
        key: dataType.key,
        title: dataType.title,
        panelComponent: responseTabComponent(
          dataType.key,
          actionResponse?.body,
          responseTabHeight,
        ),
      };
    });

  const segmentedControlOptions =
    responseTabs &&
    responseTabs.map((item) => {
      return { value: item.key, label: item.title };
    });

  const [selectedControl, setSelectedControl] = useState(
    segmentedControlOptions[0]?.value,
  );

  const selectedTabIndex =
    filteredResponseDataTypes &&
    filteredResponseDataTypes.findIndex(
      (dataType) => dataType.title === responseDisplayFormat?.title,
    );

  // update the selected tab in the response pane.
  const updateSelectedResponseTab = useCallback((tabKey: string) => {
    if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "API_PANE",
      });
    }
    dispatch(setApiPaneDebuggerState({ selectedTab: tabKey }));
  }, []);

  // update the height of the response pane on resize.
  const updateResponsePaneHeight = useCallback((height: number) => {
    dispatch(setApiPaneDebuggerState({ responseTabHeight: height }));
  }, []);

  // get request timestamp formatted to human readable format.
  const responseState = getUpdateTimestamp(actionResponse.request);
  // action source for analytics.
  const actionSource: SourceEntity = {
    type: ENTITY_TYPE.ACTION,
    name: currentActionConfig ? currentActionConfig.name : "API",
    id: currentActionConfig?.id || "",
  };
  const tabs: BottomTab[] = [
    {
      key: "response",
      title: "Response",
      panelComponent: (
        <ResponseTabWrapper>
          <ApiResponseMeta
            actionName={currentActionConfig?.name}
            actionResponse={actionResponse}
          />
          {Array.isArray(messages) && messages.length > 0 && (
            <HelpSection>
              {messages.map((msg, i) => (
                <Callout key={i} kind="warning">
                  {msg}
                </Callout>
              ))}
            </HelpSection>
          )}
          {isRunning && (
            <ActionExecutionInProgressView actionType="API" theme={theme} />
          )}
          {hasFailed && !isRunning ? (
            <ResponseTabErrorContainer>
              <ResponseTabErrorContent>
                <ResponseTabErrorDefaultMessage>
                  Your API failed to execute
                  {actionResponse.pluginErrorDetails && ":"}
                </ResponseTabErrorDefaultMessage>
                {actionResponse.pluginErrorDetails && (
                  <>
                    <div className="t--debugger-log-downstream-message">
                      {actionResponse.pluginErrorDetails.downstreamErrorMessage}
                    </div>
                    {actionResponse.pluginErrorDetails.downstreamErrorCode && (
                      <LogAdditionalInfo
                        text={
                          actionResponse.pluginErrorDetails.downstreamErrorCode
                        }
                      />
                    )}
                  </>
                )}
                <LogHelper
                  logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
                  name="PluginExecutionError"
                  pluginErrorDetails={actionResponse.pluginErrorDetails}
                  source={actionSource}
                />
              </ResponseTabErrorContent>
              {actionResponse.request && (
                <JsonWrapper
                  className="t--debugger-log-state"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReactJson src={responseState} {...apiReactJsonProps} />
                </JsonWrapper>
              )}
            </ResponseTabErrorContainer>
          ) : (
            <ResponseDataContainer>
              {isEmpty(actionResponse.statusCode) ? (
                <NoResponse
                  isButtonDisabled={disabled}
                  isQueryRunning={isRunning}
                  onRunClick={onRunClick}
                />
              ) : (
                <ResponseBodyContainer>
                  {isString(actionResponse?.body) &&
                  isHtml(actionResponse?.body) ? (
                    <ReadOnlyEditor
                      folding
                      height={"100%"}
                      input={{
                        value: actionResponse?.body,
                      }}
                    />
                  ) : responseTabs &&
                    responseTabs.length > 0 &&
                    selectedTabIndex !== -1 ? (
                    <SegmentedControlContainer>
                      <Flex>
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
                      </Flex>
                      {responseTabComponent(
                        selectedControl || segmentedControlOptions[0]?.value,
                        actionResponse?.body,
                        responseTabHeight,
                      )}
                    </SegmentedControlContainer>
                  ) : null}
                </ResponseBodyContainer>
              )}
            </ResponseDataContainer>
          )}
        </ResponseTabWrapper>
      ),
    },
    {
      key: "headers",
      title: "Headers",
      panelComponent: (
        <ResponseTabWrapper className="t--headers-tab">
          {hasFailed && !isRunning && (
            <Callout
              kind="error"
              links={[
                {
                  children: "Debug",
                  endIcon: "bug",
                  onClick: () => onDebugClick,
                  to: "",
                },
              ]}
            >
              {createMessage(CHECK_REQUEST_BODY)}
            </Callout>
          )}
          <ResponseDataContainer>
            {isEmpty(actionResponse.statusCode) ? (
              <NoResponse
                isButtonDisabled={disabled}
                isQueryRunning={isRunning}
                onRunClick={onRunClick}
              />
            ) : (
              <ReadOnlyEditor
                folding
                height={"100%"}
                input={{
                  value: !isEmpty(responseHeaders)
                    ? JSON.stringify(responseHeaders, null, 2)
                    : "",
                }}
              />
            )}
          </ResponseDataContainer>
        </ResponseTabWrapper>
      ),
    },
  ];

  if (ideViewMode === EditorViewMode.FullScreen) {
    tabs.push(
      {
        key: DEBUGGER_TAB_KEYS.ERROR_TAB,
        title: createMessage(DEBUGGER_ERRORS),
        count: errorCount,
        panelComponent: <ErrorLogs />,
      },
      {
        key: DEBUGGER_TAB_KEYS.LOGS_TAB,
        title: createMessage(DEBUGGER_LOGS),
        panelComponent: <DebuggerLogs searchQuery={props.apiName} />,
      },
    );
  }

  // close the debugger
  //TODO: move this to a common place
  const onClose = () => dispatch(setApiPaneDebuggerState({ open: false }));

  if (!open) return null;

  return (
    <ResponseContainer className="t--api-bottom-pane-container" ref={panelRef}>
      <Resizer
        initialHeight={responseTabHeight}
        onResizeComplete={(height: number) => {
          updateResponsePaneHeight(height);
        }}
        openResizer={isRunning}
        panelRef={panelRef}
        snapToHeight={ActionExecutionResizerHeight}
      />
      <TabbedViewWrapper>
        <EntityBottomTabs
          expandedHeight={`${ActionExecutionResizerHeight}px`}
          onSelect={updateSelectedResponseTab}
          selectedTabKey={selectedTab || ""}
          tabs={tabs}
        />
        <CloseDebugger
          className="close-debugger t--close-debugger"
          isIconButton
          kind="tertiary"
          onClick={onClose}
          size="md"
          startIcon="close-modal"
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  );
}

export default ApiResponseView;
