import React, { useRef, RefObject, useCallback } from "react";
import { connect, useDispatch } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionResponse } from "api/ActionAPI";
import { formatBytes } from "utils/helpers";
import { APIEditorRouteParams } from "constants/routes";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { getActionResponses } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import _ from "lodash";
import {
  CHECK_REQUEST_BODY,
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_RESPONSE_LAST_HALF,
  INSPECT_ENTITY,
} from "@appsmith/constants/messages";
import Text, { TextType } from "components/ads/Text";
import { Text as BlueprintText } from "@blueprintjs/core";
import Icon from "components/ads/Icon";
import { Classes, Variant } from "components/ads/common";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import Callout from "components/ads/Callout";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DebugButton } from "./Debugger/DebugCTA";
import EntityDeps from "./Debugger/EntityDependecies";
import Button, { Size } from "components/ads/Button";
import EntityBottomTabs from "./EntityBottomTabs";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import { setCurrentTab } from "actions/debuggerActions";

type TextStyleProps = {
  accent: "primary" | "secondary" | "error";
};
export const BaseText = styled(BlueprintText)<TextStyleProps>``;

const ResponseContainer = styled.div`
  ${ResizerCSS}
  // Initial height of bottom tabs
  height: ${(props) => props.theme.actionsBottomTabInitialHeight};
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
  right: ${(props) => props.theme.spaces[12]}px;
  top: ${(props) => props.theme.spaces[4]}px;
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
      padding: 0px ${(props) => props.theme.spaces[12]}px;
    }
  }

  & {
    .react-tabs__tab-panel {
      height: calc(100% - 32px);
    }
  }
`;

const SectionDivider = styled.div`
  height: 2px;
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
  }
`;

const StyledCallout = styled(Callout)`
  .${Classes.TEXT} {
    line-height: normal;
  }
`;

const InlineButton = styled(Button)`
  display: inline-flex;
  margin: 0 4px;
`;

const HelpSection = styled.div`
  padding-bottom: 5px;
  padding-top: 10px;
`;

interface ReduxStateProps {
  responses: Record<string, ActionResponse | undefined>;
  isRunning: Record<string, boolean>;
}

type Props = ReduxStateProps &
  RouteComponentProps<APIEditorRouteParams> & {
    theme?: EditorTheme;
    apiName: string;
    onRunClick: () => void;
  };

export const EMPTY_RESPONSE: ActionResponse = {
  statusCode: "",
  duration: "",
  body: {},
  headers: {},
  request: {
    headers: {},
    body: {},
    httpMethod: "",
    url: "",
  },
  size: "",
};

const StatusCodeText = styled(BaseText)<{ code: string }>`
  color: ${(props) =>
    props.code.startsWith("2") ? props.theme.colors.primaryOld : Colors.RED};
  cursor: pointer;
  width: 38px;
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
  margin-bottom: 10px;
  flex-direction: column;
  & .CodeEditorTarget {
    overflow: hidden;
  }
`;

function ApiResponseView(props: Props) {
  const {
    match: {
      params: { apiId },
    },
    responses,
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
    dispatch(setCurrentTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }, []);

  const onRunClick = () => {
    props.onRunClick();
    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "API_PANE",
    });
  };

  const messages = response?.messages;
  let responseHeaders;

  // if no headers are present in the response, use the default body text.
  if (response.headers) {
    responseHeaders = response.headers;
  } else {
    responseHeaders = {}; // if the response headers is empty show an empty object.
  }

  const tabs = [
    {
      key: "body",
      title: "Body",
      panelComponent: (
        <ResponseTabWrapper>
          {Array.isArray(messages) && messages.length > 0 && (
            <HelpSection>
              {messages.map((msg, i) => (
                <Callout fill key={i} text={msg} variant={Variant.warning} />
              ))}
            </HelpSection>
          )}
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
            {_.isEmpty(response.statusCode) ? (
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
                  value: response.body
                    ? JSON.stringify(response.body, null, 2)
                    : "",
                }}
              />
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
            {_.isEmpty(response.statusCode) ? (
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
                  value: response.body
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
    <ResponseContainer ref={panelRef}>
      <Resizer panelRef={panelRef} />
      <SectionDivider />
      {isRunning && (
        <LoadingOverlayScreen theme={props.theme}>
          Sending Request
        </LoadingOverlayScreen>
      )}
      <TabbedViewWrapper>
        {response.statusCode && (
          <ResponseMetaWrapper>
            {response.statusCode && (
              <Flex>
                <Text type={TextType.P3}>Status: </Text>
                <StatusCodeText
                  accent="secondary"
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
              {!_.isEmpty(response.body) && Array.isArray(response.body) && (
                <Flex>
                  <Text type={TextType.P3}>Result: </Text>
                  <Text type={TextType.H5}>
                    {`${response.body.length} Record${
                      response.body.length > 1 ? "s" : ""
                    }`}
                  </Text>
                </Flex>
              )}
            </ResponseMetaInfo>
          </ResponseMetaWrapper>
        )}
        <EntityBottomTabs defaultIndex={0} tabs={tabs} />
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

export default connect(mapStateToProps)(withRouter(ApiResponseView));
