import React, { useState } from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import { BaseText } from "components/designSystems/blueprint/TextComponent";
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
import { RequestView } from "./RequestView";
import { useLocalStorage } from "utils/hooks/localstorage";
import {
  CHECK_REQUEST_BODY,
  createMessage,
  SHOW_REQUEST,
} from "constants/messages";
import { TabComponent } from "components/ads/Tabs";
import Text, { Case, TextType } from "components/ads/Text";
import Icon from "components/ads/Icon";
import { Classes, Variant } from "components/ads/common";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import Callout from "components/ads/Callout";

const ResponseContainer = styled.div`
  position: relative;
  flex: 1;
  height: 50%;
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

const TabbedViewWrapper = styled.div<{ isCentered: boolean }>`
  height: calc(100% - 30px);

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
    }
  }

  ${(props) =>
    props.isCentered
      ? `
    &&& {
      .react-tabs__tab-panel {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    }
  `
      : null}
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
  height: 100%;
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
`;

const ShowRequestText = styled.a`
  display: flex;
  margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  .${Classes.ICON} {
    margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  }
`;

interface ReduxStateProps {
  responses: Record<string, ActionResponse | undefined>;
  isRunning: Record<string, boolean>;
}

type Props = ReduxStateProps &
  RouteComponentProps<APIEditorRouteParams> & { theme?: EditorTheme };

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
`;

const ApiResponseView = (props: Props) => {
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

  const [requestDebugVisible, setRequestDebugVisible] = useLocalStorage(
    "requestDebugVisible",
    "true",
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabs = [
    {
      key: "body",
      title: "Response Body",
      panelComponent: (
        <ResponseTabWrapper>
          {hasFailed && !isRunning && requestDebugVisible && (
            <Callout
              text={createMessage(CHECK_REQUEST_BODY)}
              label={
                <FailedMessage>
                  <ShowRequestText
                    href={"#!"}
                    onClick={() => {
                      setSelectedIndex(1);
                    }}
                  >
                    <Text type={TextType.H6} case={Case.UPPERCASE}>
                      {createMessage(SHOW_REQUEST)}
                    </Text>
                    <Icon name="right-arrow" />
                  </ShowRequestText>
                </FailedMessage>
              }
              variant={Variant.warning}
              fill
              closeButton
              onClose={() => setRequestDebugVisible(false)}
            />
          )}
          {_.isEmpty(response.statusCode) ? (
            <NoResponseContainer>
              <Icon name="no-response" />
              <Text type={TextType.P1}>Hit Run to get a Response</Text>
            </NoResponseContainer>
          ) : (
            <ReadOnlyEditor
              input={{
                value: response.body
                  ? JSON.stringify(response.body, null, 2)
                  : "",
              }}
              height={"100%"}
            />
          )}
        </ResponseTabWrapper>
      ),
    },
    {
      key: "request",
      title: "Request",
      panelComponent: (
        <RequestView
          requestURL={response.request?.url || ""}
          requestHeaders={response.request?.headers || {}}
          requestMethod={response.request?.httpMethod || ""}
          requestBody={
            _.isObject(response.request?.body)
              ? JSON.stringify(response.request?.body, null, 2)
              : response.request?.body || ""
          }
        />
      ),
    },
  ];

  return (
    <ResponseContainer>
      <SectionDivider />
      {isRunning && (
        <LoadingOverlayScreen theme={props.theme}>
          Sending Request
        </LoadingOverlayScreen>
      )}
      <TabbedViewWrapper
        isCentered={_.isEmpty(response.body) && selectedIndex === 0}
      >
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
            </ResponseMetaInfo>
          </ResponseMetaWrapper>
        )}
        <TabComponent
          tabs={tabs}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  );
};

const mapStateToProps = (state: AppState): ReduxStateProps => {
  return {
    responses: getActionResponses(state),
    isRunning: state.ui.apiPane.isRunning,
  };
};

export default connect(mapStateToProps)(withRouter(ApiResponseView));
