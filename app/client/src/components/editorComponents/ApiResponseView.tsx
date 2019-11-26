import React from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import FormRow from "./FormRow";
import { BaseText } from "components/designSystems/blueprint/TextComponent";
import { BaseTabbedView } from "components/designSystems/appsmith/TabbedView";
import styled from "styled-components";
import { AppState } from "reducers";
import CodeEditor from "./CodeEditor";
import { ActionResponse } from "api/ActionAPI";
import { formatBytes } from "utils/helpers";
import { APIEditorRouteParams } from "constants/routes";

const ResponseWrapper = styled.div`
  position: relative;
  flex: 4;
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
    props.code.match(/2\d\d/) ? props.theme.colors.primary : "red"};
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

const LoadingScreen = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  z-index: 1;
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ReduxStateProps {
  responses: {
    [id: string]: ActionResponse;
  };
  isRunning: boolean;
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

const EMPTY_RESPONSE = {
  statusCode: "",
  duration: "",
  body: {},
  headers: {},
  size: "",
};

const ApiResponseView = (props: Props) => {
  const {
    match: {
      params: { apiId },
    },
    responses,
  } = props;
  let response: ActionResponse = EMPTY_RESPONSE;
  if (apiId && apiId in responses) {
    response = responses[apiId];
  }
  return (
    <ResponseWrapper>
      {props.isRunning && <LoadingScreen>Sending Request</LoadingScreen>}
      <FormRow>
        <React.Fragment>
          {response.statusCode && (
            <StatusCodeText
              styleName="secondary"
              code={response.statusCode.toString()}
            >
              Status: {response.statusCode}
            </StatusCodeText>
          )}
          <ResponseMetaInfo>
            {response.duration && (
              <BaseText styleName="secondary">
                Time: {response.duration} ms
              </BaseText>
            )}
            {response.size && (
              <BaseText styleName="secondary">
                Size: {formatBytes(parseInt(response.size))}
              </BaseText>
            )}
          </ResponseMetaInfo>
        </React.Fragment>
      </FormRow>
      <BaseTabbedView
        tabs={[
          {
            key: "body",
            title: "Response Body",
            panelComponent: (
              <CodeEditor
                theme={"LIGHT"}
                height={600}
                language={"json"}
                input={{
                  value: response.body
                    ? JSON.stringify(response.body, null, 2)
                    : "",
                }}
                lineNumbersMinChars={2}
              />
            ),
          },
          {
            key: "headers",
            title: "Response Headers",
            panelComponent: <ResponseHeadersView data={response.headers} />,
          },
        ]}
      />
    </ResponseWrapper>
  );
};

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  responses: state.entities.apiData,
  isRunning: state.ui.apiPane.isRunning,
});

export default connect(mapStateToProps)(withRouter(ApiResponseView));
