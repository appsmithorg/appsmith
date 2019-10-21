import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "../../reducers";
import { fetchActions } from "../../actions/actionActions";
import { ActionDataState } from "../../reducers/entityReducers/actionsReducer";
import { API_EDITOR_ID_URL } from "../../constants/routes";

const ApiItem = styled.div<{ isSelected: boolean }>`
  width: 100%;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  background-color: ${props =>
    props.isSelected ? props.theme.colors.paneCard : props.theme.colors.paneBG}
  :hover {
    background-color: ${props => props.theme.colors.paneCard};
  }
`;

const HTTPMethod = styled.span<{ method: string }>`
  flex: 1;
  color: ${props => {
    switch (props.method) {
      case "GET":
        return "#29CCA3";
      case "POST":
        return "#F7C75B";
      case "PUT":
        return "#30A5E0";
      case "DELETE":
        return "#CE4257";
      default:
        return "#333";
    }
  }};
`;

const ActionName = styled.span`
  flex: 3;
`;

interface ReduxStateProps {
  actions: ActionDataState;
}

interface ReduxActionProps {
  fetchActions: () => void;
  selectAction: (id: string) => void;
}

type Props = ReduxStateProps &
  ReduxActionProps &
  RouteComponentProps<{ id: string }>;

class ApiSidebar extends React.Component<Props> {
  componentDidMount(): void {
    this.props.fetchActions();
  }

  render() {
    const { actions, history, match } = this.props;
    const activeActionId = match.params.id;
    return (
      <React.Fragment>
        {actions.loading && "Loading..."}
        {actions.data.map(action => (
          <ApiItem
            key={action.id}
            onClick={() => history.push(API_EDITOR_ID_URL(action.id))}
            isSelected={activeActionId === action.id}
          >
            <HTTPMethod method={action.actionConfiguration.httpMethod}>
              {action.actionConfiguration.httpMethod}
            </HTTPMethod>
            <ActionName>{action.name}</ActionName>
          </ApiItem>
        ))}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  actions: state.entities.actions,
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchActions: () => dispatch(fetchActions()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ApiSidebar);
