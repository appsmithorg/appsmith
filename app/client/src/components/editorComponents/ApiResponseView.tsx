import type { PropsWithChildren, RefObject } from "react";
import React, { useCallback, useRef } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { withRouter } from "react-router";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import type { ActionResponse } from "api/ActionAPI";
import ActionAPI from "api/ActionAPI";
import { formatBytes } from "utils/helpers";
import type { APIEditorRouteParams } from "constants/routes";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { getActionResponses } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { isArray, isEmpty, isString } from "lodash";
import {
  ACTION_EXECUTION_MESSAGE,
  CHECK_REQUEST_BODY,
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_RESPONSE_LAST_HALF,
  INSPECT_ENTITY,
} from "@appsmith/constants/messages";
import { Text as BlueprintText } from "@blueprintjs/core";
import type { EditorTheme } from "./CodeEditor/EditorConfig";
import NoResponse from "assets/images/no-response.svg";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import EntityDeps from "./Debugger/EntityDependecies";
import { Classes, TAB_MIN_HEIGHT, Text, TextType } from "design-system-old";
import { Button, Callout, Icon } from "design-system";
import EntityBottomTabs from "./EntityBottomTabs";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import Table from "pages/Editor/QueryEditor/Table";
import { API_RESPONSE_TYPE_OPTIONS } from "constants/ApiEditorConstants/CommonApiConstants";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { isHtml } from "./utils";
import {
  getApiPaneResponsePaneHeight,
  getApiPaneResponseSelectedTab,
} from "selectors/apiPaneSelectors";
import {
  setApiPaneResponsePaneHeight,
  setApiPaneResponseSelectedTab,
} from "actions/apiPaneActions";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";

type TextStyleProps = {
  accent: "primary" | "secondary" | "error";
};
export const BaseText = styled(BlueprintText)<TextStyleProps>``;

const ResponseContainer = styled.div`
  ${ResizerCSS};
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};

  .react-tabs__tab-panel {
    overflow: hidden;
  }
  .CodeMirror-code {
    font-size: 12px;
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

  &&& {
    ul.react-tabs__tab-list {
      margin: 0 ${(props) => props.theme.spaces[11]}px;
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
  overflow-y: auto;
  height: 100%;
  display: grid;
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
    props.code.startsWith("2") ? props.theme.colors.primaryOld : Colors.RED};
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
  padding-bottom: 10px;
  flex-direction: column;
  & .CodeEditorTarget {
    overflow: hidden;
  }
`;

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
        isReadOnly
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
        isReadOnly
      />
    ),
  }[responseType];
};

export const handleCancelActionExecution = () => {
  ActionAPI.abortActionExecutionTokenSource.cancel();
};

const StyledText = styled(Text)`
  &&&& {
    margin-top: 0;
  }
`;
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
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();

  const onDebugClick = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "API",
    });
    dispatch(setApiPaneResponseSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
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

  const selectedResponseTab = useSelector(getApiPaneResponseSelectedTab);
  const updateSelectedResponseTab = useCallback((tabKey: string) => {
    if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "API_PANE",
      });
    }
    dispatch(setApiPaneResponseSelectedTab(tabKey));
  }, []);

  const responsePaneHeight = useSelector(getApiPaneResponsePaneHeight);
  const updateResponsePaneHeight = useCallback((height: number) => {
    dispatch(setApiPaneResponsePaneHeight(height));
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

  const tabs = [
    {
      key: "response",
      title: "Response",
      panelComponent: (
        <ResponseTabWrapper>
          {Array.isArray(messages) && messages.length > 0 && (
            <HelpSection>
              {messages.map((msg, i) => (
                <Callout key={i} kind="warning">
                  {msg}
                </Callout>
              ))}
            </HelpSection>
          )}
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
            {isEmpty(response.statusCode) ? (
              <NoResponseContainer>
                <img alt="no-response-yet" src={NoResponse} />
                <div className="flex gap-2 items-center mt-4">
                  <StyledText type={TextType.P1}>
                    {EMPTY_RESPONSE_FIRST_HALF()}
                  </StyledText>
                  <Button
                    isDisabled={disabled}
                    isLoading={isRunning}
                    onClick={onRunClick}
                    size="md"
                  >
                    Run
                  </Button>
                  <StyledText type={TextType.P1}>
                    {EMPTY_RESPONSE_LAST_HALF()}
                  </StyledText>
                </div>
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
                    isReadOnly
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
        </ResponseTabWrapper>
      ),
    },
    {
      key: "headers",
      title: "Headers",
      panelComponent: (
        <ResponseTabWrapper>
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
            {isEmpty(response.statusCode) ? (
              <NoResponseContainer>
                <Icon name="no-response" />
                <Text type={TextType.P1}>
                  {EMPTY_RESPONSE_FIRST_HALF()}
                  <Button isLoading={isRunning} onClick={onRunClick} size="md">
                    Run
                  </Button>
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
                isReadOnly
              />
            )}
          </ResponseDataContainer>
        </ResponseTabWrapper>
      ),
    },
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
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
      {isRunning && (
        <>
          <LoadingOverlayScreen theme={props.theme} />
          <LoadingOverlayContainer>
            <div>
              <Text textAlign={"center"} type={TextType.P1}>
                {createMessage(ACTION_EXECUTION_MESSAGE, "API")}
              </Text>
              <Button
                className={`t--cancel-action-button`}
                kind="secondary"
                onClick={() => {
                  handleCancelActionExecution();
                }}
                size="md"
              >
                Cancel Request
              </Button>
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
          containerRef={panelRef}
          expandedHeight={`${ActionExecutionResizerHeight}px`}
          onSelect={updateSelectedResponseTab}
          selectedTabKey={selectedResponseTab}
          tabs={tabs}
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  );
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  return {
    responses: getActionResponses(state),
    isRunning: state.ui.apiPane.isRunning,
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
