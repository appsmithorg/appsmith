import React, { useState } from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import FormRow from "./FormRow";
import { BaseText } from "components/designSystems/blueprint/TextComponent";
import { BaseTabbedView } from "components/designSystems/appsmith/TabbedView";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionResponse } from "api/ActionAPI";
import { formatBytes } from "utils/helpers";
import { APIEditorRouteParams } from "constants/routes";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import CodeEditor from "components/editorComponents/CodeEditor";
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

const ResponseWrapper = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
  overflow-y: scroll;
`;
const ResponseMetaInfo = styled.div`
  display: flex;
  ${BaseText} {
    color: #768896;
    margin: 0 5px;
  }
`;

const StatusCodeText = styled(BaseText)<{ code: string }>`
  color: ${props =>
    props.code.match(/2\d\d/) ? props.theme.colors.primary : Colors.RED};
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
  font-family: DM Sans;
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

const TabbedViewWrapper = styled.div`
  height: calc(100% - 30px);
`;

const StyledFormActionButton = styled(FormActionButton)`
  &&& {
    padding: 10px 12px 9px 9px;
    margin-right: 9px;
    border: 0;
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
          <CodeEditor
            input={{
              value: response.body
                ? JSON.stringify(response.body, null, 2)
                : "",
            }}
            height={"100%"}
          />
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
      {isRunning && (
        <LoadingOverlayScreen>Sending Request</LoadingOverlayScreen>
      )}
      <FormRow>
        <React.Fragment>
          {response.statusCode && (
            <StatusCodeText
              accent="secondary"
              code={response.statusCode.toString()}
            >
              Status: {response.statusCode}
            </StatusCodeText>
          )}
          <ResponseMetaInfo>
            {response.duration && (
              <BaseText accent="secondary">
                Time: {response.duration} ms
              </BaseText>
            )}
            {response.size && (
              <BaseText accent="secondary">
                Size: {formatBytes(parseInt(response.size))}
              </BaseText>
            )}
          </ResponseMetaInfo>
        </React.Fragment>
      </FormRow>
      <TabbedViewWrapper>
        <BaseTabbedView
          overflow
          tabs={tabs}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
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
