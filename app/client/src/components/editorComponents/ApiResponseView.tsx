import React from "react";
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
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import CodeEditor from "components/editorComponents/CodeEditor";
import { getActionResponses } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";

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
  apiPane: ApiPaneReduxState;
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
    apiPane,
  } = props;
  let response: ActionResponse = EMPTY_RESPONSE;
  let isRunning = false;
  if (apiId && apiId in responses) {
    response = responses[apiId] || EMPTY_RESPONSE;
    isRunning = apiPane.isRunning[apiId];
  }
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
      <BaseTabbedView
        tabs={[
          {
            key: "body",
            title: "Response Body",
            panelComponent: (
              <CodeEditor
                input={{
                  value: response.body
                    ? JSON.stringify(response.body, null, 2)
                    : "",
                }}
                height={700}
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
  responses: getActionResponses(state),
  apiPane: state.ui.apiPane,
});

export default connect(mapStateToProps)(withRouter(ApiResponseView));
