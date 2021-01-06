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
import FormActionButton from "./form/FormActionButton";
import { RequestView } from "./RequestView";
import { useLocalStorage } from "utils/hooks/localstorage";
import {
  CHECK_REQUEST_BODY,
  DONT_SHOW_THIS_AGAIN,
  SHOW_REQUEST,
} from "constants/messages";
import { TabComponent } from "components/ads/Tabs";
import Text, { TextType } from "components/ads/Text";
import Icon from "components/ads/Icon";
import { Classes } from "components/ads/common";

const ResponseWrapper = styled.div`
  position: relative;
  flex: 1;
  height: 50%;
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};
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
`;

const StatusCodeText = styled(BaseText)<{ code: string }>`
  color: ${(props) =>
    props.code.match(/2\d\d/) ? props.theme.colors.primaryOld : Colors.RED};
`;

// const TableWrapper = styled.div`
//   &&& {
//     table {
//       table-layout: fixed;
//       width: 100%;
//       td {
//         font-size: 12px;
//         width: 50%;
//         white-space: nowrap;
//         overflow: hidden;
//         text-overflow: ellipsis;
//       }
//     }
//   }
// `;

interface ReduxStateProps {
  responses: Record<string, ActionResponse | undefined>;
  isRunning: Record<string, boolean>;
}

// const ResponseHeadersView = (props: { data: Record<string, string[]> }) => {
//   if (!props.data) return <div />;
//   return (
//     <TableWrapper>
//       <table className="bp3-html-table bp3-html-table-striped bp3-html-table-condensed">
//         <thead>
//           <tr>
//             <th>Key</th>
//             <th>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Object.keys(props.data).map(k => (
//             <tr key={k}>
//               <td>{k}</td>
//               <td>{props.data[k].join(", ")}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </TableWrapper>
//   );
// };

type Props = ReduxStateProps & RouteComponentProps<APIEditorRouteParams>;

const EMPTY_RESPONSE: ActionResponse = {
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

const FailedMessageContainer = styled.div`
  width: 100%;
  background: #29cca3;
  height: 77px;
  position: absolute;
  z-index: 10;
  bottom: 0;
  padding-top: 10px;
  padding-bottom: 7px;
  padding-left: 15px;
  font-family: ${(props) => props.theme.fonts.text};
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  p {
    margin-bottom: 5px;
    color: white;
  }
  // display: flex;
  // justify-content: center;
  // align-items: center;
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

const StyledFormActionButton = styled(FormActionButton)`
  &&& {
    padding: 10px 12px 9px 9px;
    margin-right: 9px;
    border: 0;
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
        <>
          {hasFailed && !isRunning && requestDebugVisible === "true" && (
            <FailedMessageContainer>
              <p>{CHECK_REQUEST_BODY}</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <StyledFormActionButton
                  intent={"danger"}
                  style={{
                    background: "white",
                    color: "#29CCA3",
                  }}
                  text={DONT_SHOW_THIS_AGAIN}
                  onClick={() => {
                    setRequestDebugVisible(false);
                  }}
                />
                <StyledFormActionButton
                  style={{
                    background: "#EF7541",
                    color: "white",
                  }}
                  intent={"danger"}
                  text={SHOW_REQUEST}
                  onClick={() => {
                    setSelectedIndex(1);
                  }}
                />
              </div>
            </FailedMessageContainer>
          )}
          {_.isEmpty(response.body) ? (
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
        </>
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
    <ResponseWrapper>
      <SectionDivider />
      {isRunning && (
        <LoadingOverlayScreen>Sending Request</LoadingOverlayScreen>
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
    </ResponseWrapper>
  );
};

const mapStateToProps = (state: AppState): ReduxStateProps => {
  return {
    responses: getActionResponses(state),
    isRunning: state.ui.apiPane.isRunning,
  };
};

export default connect(mapStateToProps)(withRouter(ApiResponseView));
