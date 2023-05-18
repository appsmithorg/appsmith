import type { RefObject, PropsWithChildren } from "react";
import React, { useRef, useCallback } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { withRouter } from "react-router";
import ReactJson from "react-json-view";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import type { ActionResponse } from "api/ActionAPI";
import { formatBytes } from "utils/helpers";
import type { APIEditorRouteParams } from "constants/routes";
import type { SourceEntity } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { getActionResponses } from "selectors/entitiesSelector";
import { isArray, isEmpty, isString } from "lodash";
import {
  CHECK_REQUEST_BODY,
  createMessage,
  DEBUGGER_LOGS,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_RESPONSE_LAST_HALF,
  INSPECT_ENTITY,
  ACTION_EXECUTION_MESSAGE,
  DEBUGGER_ERRORS,
} from "@appsmith/constants/messages";
import { Text as BlueprintText } from "@blueprintjs/core";
import type { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DebugButton } from "./Debugger/DebugCTA";
import EntityDeps from "./Debugger/EntityDependecies";
import {
  Button,
  Callout,
  Category,
  Classes,
  Icon,
  IconSize,
  Size,
  TAB_MIN_HEIGHT,
  Text,
  TextType,
  Variant,
} from "design-system-old";
import EntityBottomTabs from "./EntityBottomTabs";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import Table from "pages/Editor/QueryEditor/Table";
import { API_RESPONSE_TYPE_OPTIONS } from "constants/ApiEditorConstants/CommonApiConstants";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { isHtml } from "./utils";
import ActionAPI from "api/ActionAPI";
import {
  getDebuggerSelectedTab,
  getResponsePaneHeight,
} from "selectors/debuggerSelectors";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import LogAdditionalInfo from "./Debugger/ErrorLogs/components/LogAdditionalInfo";
import {
  JsonWrapper,
  reactJsonProps,
} from "./Debugger/ErrorLogs/components/LogCollapseData";
import LogHelper from "./Debugger/ErrorLogs/components/LogHelper";
import { getUpdateTimestamp } from "./Debugger/ErrorLogs/ErrorLogItem";
import type { Action } from "entities/Action";

type TextStyleProps = {
  accent: "primary" | "secondary" | "error";
};
export const BaseText = styled(BlueprintText)<TextStyleProps>``;

const ResponseContainer = styled.div`
  ${ResizerCSS}
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};

  .react-tabs__tab-panel {
    overflow: hidden;
  }
`;
const ResponseMetaInfo = styled.div`
  display: flex;
  ${BaseText} {
    color: #768896;
    margin-left: ${(props) => props.theme.spaces[9]}px;
  }
`;

const ResponseMetaWrapper = styled.div`
  align-items: center;
  display: flex;
  position: absolute;
  right: ${(props) => props.theme.spaces[17] + 1}px;
  top: ${(props) => props.theme.spaces[2] + 1}px;
`;

const ResponseTabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const TabbedViewWrapper = styled.div`
  height: 100%;

  .close-debugger {
    position: absolute;
    top: 0px;
    right: 0px;
    padding: 9px 11px;
  }

  &&& {
    ul.react-tabs__tab-list {
      margin: 0px ${(props) => props.theme.spaces[11]}px;
      height: ${TAB_MIN_HEIGHT};
    }
  }

  & {
    .react-tabs__tab-panel {
      height: calc(100% - ${TAB_MIN_HEIGHT});
    }
  }
`;

export const SectionDivider = styled.div`
  height: 1px;
  width: 100%;
  background: ${(props) => props.theme.colors.apiPane.dividerBg};
`;

const Flex = styled.div`
  display: flex;
  align-items: center;
  margin-left: 20px;

  span:first-child {
    margin-right: ${(props) => props.theme.spaces[1] + 1}px;
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
    margin-right: 0px;
    svg {
      width: 150px;
      height: 150px;
    }
  }

  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }
`;

const FailedMessage = styled.div`
  display: flex;
  align-items: center;
  margin-left: 5px;

  .api-debugcta {
    margin-top: 0px;
    height: 26px;
  }
`;

const StyledCallout = styled(Callout)`
  .${Classes.TEXT} {
    line-height: normal;
    font-size: 12px;
  }
  .${Classes.ICON} {
    width: 16px;
  }
`;

export const InlineButton = styled(Button)`
  display: inline-flex;
  margin: 0 8px;
`;

const HelpSection = styled.div`
  padding-bottom: 5px;
  padding-top: 10px;
`;

const ResponseBodyContainer = styled.div`
  overflow-y: auto;
  height: 100%;
  display: grid;
`;

export const CancelRequestButton = styled(Button)`
  margin-top: 10px;
`;

export const LoadingOverlayContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  position: relative;
  z-index: 20;
  width: 100%;
  height: 100%;
  margin-top: 5px;
`;
interface ReduxStateProps {
  responses: Record<string, ActionResponse | undefined>;
  isRunning: Record<string, boolean>;
  errorCount: number;
}
interface ReduxDispatchProps {
  updateActionResponseDisplayFormat: ({
    field,
    id,
    value,
  }: UpdateActionPropertyActionPayload) => void;
}

type Props = ReduxStateProps &
  ReduxDispatchProps &
  RouteComponentProps<APIEditorRouteParams> & {
    theme?: EditorTheme;
    apiName: string;
    disabled?: boolean;
    onRunClick: () => void;
    responseDataTypes: { key: string; title: string }[];
    responseDisplayFormat: { title: string; value: string };
  };

export const EMPTY_RESPONSE: ActionResponse = {
  statusCode: "",
  duration: "",
  body: "",
  headers: {},
  request: {
    headers: {},
    body: {},
    httpMethod: "",
    url: "",
  },
  size: "",
  responseDisplayFormat: "",
  dataTypes: [],
};

const StatusCodeText = styled(BaseText)<PropsWithChildren<{ code: string }>>`
  color: ${(props) =>
    props.code.startsWith("2")
      ? props.theme.colors.primaryOld
      : props.theme.colors.debugger.floatingButton.errorCount};
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
    width: 100%;
  }
`;

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
  max-height: 100%;
  overflow: auto;
  background: #fff8f8;
  box-shadow: 0px 1px 0px #ffecec;
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
        containerHeight={tableBodyHeight}
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
        containerHeight={tableBodyHeight}
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

export const handleCancelActionExecution = () => {
  ActionAPI.abortActionExecutionTokenSource.cancel();
};

function ApiResponseView(props: Props) {
  const {
    disabled,
    match: {
      params: { apiId },
    },
    responseDataTypes,
    responseDisplayFormat,
    responses,
    updateActionResponseDisplayFormat,
  } = props;
  let response: ActionResponse = EMPTY_RESPONSE;
  let isRunning = false;
  let hasFailed = false;
  if (apiId && apiId in responses) {
    response = responses[apiId] || EMPTY_RESPONSE;
    isRunning = props.isRunning[apiId];
    hasFailed = response.statusCode ? response.statusCode[0] !== "2" : false;
  }
  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === apiId,
  );
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();

  const onDebugClick = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "API",
    });
    dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }, []);

  const onRunClick = () => {
    props.onRunClick();
    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "API_PANE",
    });
  };

  const messages = response?.messages;
  let responseHeaders = {};

  // if no headers are present in the response, use the default body text.
  if (response.headers) {
    Object.entries(response.headers).forEach(([key, value]) => {
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
    updateActionResponseDisplayFormat({
      id: apiId ? apiId : "",
      field: "responseDisplayFormat",
      value: tab,
    });
  };

  let filteredResponseDataTypes: { key: string; title: string }[] = [
    ...responseDataTypes,
  ];
  if (!!response.body && !isArray(response.body)) {
    filteredResponseDataTypes = responseDataTypes.filter(
      (item) => item.key !== API_RESPONSE_TYPE_OPTIONS.TABLE,
    );
    if (responseDisplayFormat.title === API_RESPONSE_TYPE_OPTIONS.TABLE) {
      onResponseTabSelect(filteredResponseDataTypes[0]?.title);
    }
  }

  const selectedTabIndex =
    filteredResponseDataTypes &&
    filteredResponseDataTypes.findIndex(
      (dataType) => dataType.title === responseDisplayFormat?.title,
    );

  // get the selected tab in the response pane.
  const selectedResponseTab = useSelector(getDebuggerSelectedTab);
  // update the selected tab in the response pane.
  const updateSelectedResponseTab = useCallback((tabKey: string) => {
    if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "API_PANE",
      });
    }
    dispatch(setDebuggerSelectedTab(tabKey));
  }, []);
  // get the height of the response pane.
  const responsePaneHeight = useSelector(getResponsePaneHeight);
  // update the height of the response pane on resize.
  const updateResponsePaneHeight = useCallback((height: number) => {
    dispatch(setResponsePaneHeight(height));
  }, []);

  const responseTabs =
    filteredResponseDataTypes &&
    filteredResponseDataTypes.map((dataType, index) => {
      return {
        index: index,
        key: dataType.key,
        title: dataType.title,
        panelComponent: responseTabComponent(
          dataType.key,
          response?.body,
          responsePaneHeight,
        ),
      };
    });
  // get request timestamp formatted to human readable format.
  const responseState = getUpdateTimestamp(response.request);
  // action source for analytics.
  const actionSource: SourceEntity = {
    type: ENTITY_TYPE.ACTION,
    name: currentActionConfig ? currentActionConfig.name : "API",
    id: apiId ? apiId : "",
  };
  const tabs = [
    {
      key: "response",
      title: "Response",
      panelComponent: (
        <ResponseTabWrapper>
          {Array.isArray(messages) && messages.length > 0 && (
            <HelpSection>
              {messages.map((msg, i) => (
                <Callout fill key={i} text={msg} variant={Variant.warning} />
              ))}
            </HelpSection>
          )}
          {hasFailed && !isRunning ? (
            <ResponseTabErrorContainer>
              <ResponseTabErrorContent>
                <ResponseTabErrorDefaultMessage>
                  Your API failed to execute
                  {response.pluginErrorDetails && ":"}
                </ResponseTabErrorDefaultMessage>
                {response.pluginErrorDetails && (
                  <>
                    <div>
                      {response.pluginErrorDetails.downstreamErrorMessage}
                    </div>
                    {response.pluginErrorDetails.downstreamErrorCode && (
                      <LogAdditionalInfo
                        text={response.pluginErrorDetails.downstreamErrorCode}
                      />
                    )}
                  </>
                )}
                <LogHelper
                  logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
                  name="PluginExecutionError"
                  pluginErrorDetails={response.pluginErrorDetails}
                  source={actionSource}
                />
              </ResponseTabErrorContent>
              {response.request && (
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
              {isEmpty(response.statusCode) ? (
                <NoResponseContainer>
                  <Icon name="no-response" />
                  <Text type={TextType.P1}>
                    {EMPTY_RESPONSE_FIRST_HALF()}
                    <InlineButton
                      disabled={disabled}
                      isLoading={isRunning}
                      onClick={onRunClick}
                      size={Size.medium}
                      tag="button"
                      text="Run"
                      type="button"
                    />
                    {EMPTY_RESPONSE_LAST_HALF()}
                  </Text>
                </NoResponseContainer>
              ) : (
                <ResponseBodyContainer>
                  {isString(response?.body) && isHtml(response?.body) ? (
                    <ReadOnlyEditor
                      folding
                      height={"100%"}
                      input={{
                        value: response?.body,
                      }}
                    />
                  ) : responseTabs &&
                    responseTabs.length > 0 &&
                    selectedTabIndex !== -1 ? (
                    <EntityBottomTabs
                      onSelect={onResponseTabSelect}
                      responseViewer
                      selectedTabKey={responseDisplayFormat.value}
                      tabs={responseTabs}
                    />
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
        <ResponseTabWrapper>
          {hasFailed && !isRunning && (
            <StyledCallout
              fill
              label={
                <FailedMessage>
                  <DebugButton
                    className="api-debugcta"
                    onClick={onDebugClick}
                  />
                </FailedMessage>
              }
              text={createMessage(CHECK_REQUEST_BODY)}
              variant={Variant.danger}
            />
          )}
          <ResponseDataContainer>
            {isEmpty(response.statusCode) ? (
              <NoResponseContainer>
                <Icon name="no-response" />
                <Text type={TextType.P1}>
                  {EMPTY_RESPONSE_FIRST_HALF()}
                  <InlineButton
                    isLoading={isRunning}
                    onClick={onRunClick}
                    size={Size.medium}
                    tag="button"
                    text="Run"
                    type="button"
                  />
                  {EMPTY_RESPONSE_LAST_HALF()}
                </Text>
              </NoResponseContainer>
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
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      count: props.errorCount,
      panelComponent: <ErrorLogs />,
    },
    {
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={props.apiName} />,
    },
    {
      key: DEBUGGER_TAB_KEYS.INSPECT_TAB,
      title: createMessage(INSPECT_ENTITY),
      panelComponent: <EntityDeps />,
    },
  ];

  // close the debugger
  //TODO: move this to a common place
  const onClose = () => dispatch(showDebugger(false));

  return (
    <ResponseContainer className="t--api-bottom-pane-container" ref={panelRef}>
      <Resizer
        initialHeight={responsePaneHeight}
        onResizeComplete={(height: number) => {
          updateResponsePaneHeight(height);
        }}
        openResizer={isRunning}
        panelRef={panelRef}
        snapToHeight={ActionExecutionResizerHeight}
      />
      <SectionDivider />
      {isRunning && (
        <>
          <LoadingOverlayScreen theme={props.theme} />
          <LoadingOverlayContainer>
            <div>
              <Text textAlign={"center"} type={TextType.P1}>
                {createMessage(ACTION_EXECUTION_MESSAGE, "API")}
              </Text>
              <CancelRequestButton
                category={Category.secondary}
                className={`t--cancel-action-button`}
                onClick={() => {
                  handleCancelActionExecution();
                }}
                size={Size.medium}
                tag="button"
                text="Cancel Request"
                type="button"
              />
            </div>
          </LoadingOverlayContainer>
        </>
      )}
      <TabbedViewWrapper>
        {response.statusCode && (
          <ResponseMetaWrapper>
            {response.statusCode && (
              <Flex>
                <Text type={TextType.P3}>Status: </Text>
                <StatusCodeText
                  accent="secondary"
                  className="t--response-status-code"
                  code={response.statusCode.toString()}
                >
                  {response.statusCode}
                </StatusCodeText>
              </Flex>
            )}
            <ResponseMetaInfo>
              {response.duration && (
                <Flex>
                  <Text type={TextType.P3}>Time: </Text>
                  <Text type={TextType.H5}>{response.duration} ms</Text>
                </Flex>
              )}
              {response.size && (
                <Flex>
                  <Text type={TextType.P3}>Size: </Text>
                  <Text type={TextType.H5}>
                    {formatBytes(parseInt(response.size))}
                  </Text>
                </Flex>
              )}
              {!isEmpty(response?.body) && Array.isArray(response?.body) && (
                <Flex>
                  <Text type={TextType.P3}>Result: </Text>
                  <Text type={TextType.H5}>
                    {`${response?.body.length} Record${
                      response?.body.length > 1 ? "s" : ""
                    }`}
                  </Text>
                </Flex>
              )}
            </ResponseMetaInfo>
          </ResponseMetaWrapper>
        )}
        <EntityBottomTabs
          expandedHeight={`${ActionExecutionResizerHeight}px`}
          onSelect={updateSelectedResponseTab}
          selectedTabKey={selectedResponseTab}
          tabs={tabs}
        />
        <Icon
          className="close-debugger t--close-debugger"
          name="close-modal"
          onClick={onClose}
          size={IconSize.XL}
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  );
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  return {
    responses: getActionResponses(state),
    isRunning: state.ui.apiPane.isRunning,
    errorCount: state.ui.debugger.context.errorCount,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateActionResponseDisplayFormat: ({
    field,
    id,
    value,
  }: UpdateActionPropertyActionPayload) => {
    dispatch(setActionResponseDisplayFormat({ id, field, value }));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(ApiResponseView));
