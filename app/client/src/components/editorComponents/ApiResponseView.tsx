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

const TableWrapper = styled.div`
  &&& {
    table {
      table-layout: fixed;
      width: 100%;
      td {
        font-size: 12px;
        width: 50%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
`;

interface ReduxStateProps {
  responses: Record<string, ActionResponse | undefined>;
  isRunning: Record<string, boolean>;
}

const ResponseHeadersView = (props: { data: Record<string, string[]> }) => {
  if (!props.data) return <div />;
  return (
    <TableWrapper>
      <table className="bp3-html-table bp3-html-table-striped bp3-html-table-condensed">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(props.data).map(k => (
            <tr key={k}>
              <td>{k}</td>
              <td>{props.data[k].join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
};

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
  width: calc(100% - 29px);
  position: absolute;
  left: 29px;
  z-index: 10;
  bottom: 48%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TabbedViewWrapper = styled.div`
  height: calc(100% - 30px);
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

  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabs = [
    {
      key: "body",
      title: "Response Body",
      panelComponent: (
        <>
          <FailedMessageContainer>
            {hasFailed && !isRunning && (
              <FormActionButton
                intent={"danger"}
                text="Check Request body"
                onClick={() => {
                  setSelectedIndex(3);
                }}
              />
            )}
          </FailedMessageContainer>
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
      key: "headers",
      title: "Response Headers",
      panelComponent: <ResponseHeadersView data={response.headers} />,
    },
    {
      key: "requestHeaders",
      title: "Request Headers",
      panelComponent: (
        <ResponseHeadersView data={response.request?.headers || {}} />
      ),
    },
    {
      key: "requestBody",
      title: "Request Body",
      panelComponent: (
        <CodeEditor
          height={"100%"}
          input={{
            value: _.isObject(response.request?.body)
              ? JSON.stringify(response.request?.body, null, 2)
              : response.request?.body || "",
          }}
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
