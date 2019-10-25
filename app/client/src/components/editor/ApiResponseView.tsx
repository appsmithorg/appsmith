import React from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import FormRow from "./FormRow";
import { BaseText } from "../canvas/TextViewComponent";
import { BaseTabbedView } from "../canvas/TabbedView";
import JSONViewer from "./JSONViewer";
import styled from "styled-components";
import { AppState } from "../../reducers";
import { ActionApiResponse } from "../../reducers/entityReducers/actionsReducer";

const ResponseWrapper = styled.div`
  flex: 4;
`;
const ResponseMetaInfo = styled.div`
  display: flex;
  ${BaseText} {
    color: #768896;
    margin: 0 5px;
  }
`;

interface ReduxStateProps {
  responses: {
    [id: string]: ActionApiResponse;
  };
}

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

const ResponseHeadersView = (props: {
  data: { [name: string]: Array<string> };
}) => {
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

type Props = ReduxStateProps & RouteComponentProps<{ id: string }>;

const ApiResponseView = (props: Props) => {
  const response = props.responses[props.match.params.id] || {};
  return (
    <ResponseWrapper>
      <FormRow>
        <BaseText styleName="secondary">{response.statusCode}</BaseText>
        <ResponseMetaInfo>
          <BaseText styleName="secondary">300ms</BaseText>
          <BaseText styleName="secondary">203 kb</BaseText>
        </ResponseMetaInfo>
      </FormRow>
      <BaseTabbedView
        tabs={[
          {
            key: "body",
            title: "Response Body",
            panelComponent: <JSONViewer data={response.body} />,
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
  responses: state.entities.actions.responses,
});

export default connect(mapStateToProps)(withRouter(ApiResponseView));
