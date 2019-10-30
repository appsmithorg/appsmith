import React from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import FormRow from "./FormRow";
import { BaseText } from "../appsmith/TextViewComponent";
import { BaseTabbedView } from "../appsmith/TabbedView";
import styled from "styled-components";
import { AppState } from "../../reducers";
import CodeEditor from "./CodeEditor";
import { ActionApiResponse } from "../../api/ActionAPI";
import { formatBytes } from "../../utils/helpers";

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

const ResponseBodyWrapper = styled.span`
  max-height: 100%;
  &&& {
    textarea,
    pre {
      height: 100%;
      overflow: auto;
    }
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
  background-color: rgba(0, 0, 0, 0.6);
  pointer-events: none;
  z-index: 1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ReduxStateProps {
  responses: {
    [id: string]: ActionApiResponse;
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

type Props = ReduxStateProps & RouteComponentProps<{ id: string }>;

const ApiResponseView = (props: Props) => {
  const response = props.responses[props.match.params.id] || {};
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
              <ResponseBodyWrapper>
                {response.body && (
                  <CodeEditor
                    input={{
                      value: JSON.stringify(response.body, null, 2),
                    }}
                  />
                )}
              </ResponseBodyWrapper>
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
  isRunning: state.entities.actions.isRunning,
});

export default connect(mapStateToProps)(withRouter(ApiResponseView));
