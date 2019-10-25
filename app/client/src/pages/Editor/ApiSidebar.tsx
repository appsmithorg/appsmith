import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "../../reducers";
import { fetchActions } from "../../actions/actionActions";
import { ActionDataState } from "../../reducers/entityReducers/actionsReducer";
import { API_EDITOR_ID_URL, API_EDITOR_URL } from "../../constants/routes";
import { BaseButton } from "../../components/canvas/Button";
import { FormIcons } from "../../icons/FormIcons";

const ApiSidebarWrapper = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
`;
const ApiItemsWrapper = styled.div`
  flex: 1;
`;

const ApiItem = styled.div<{ isSelected: boolean }>`
  height: 32px;
  width: 100%;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  background-color: ${props =>
    props.isSelected ? props.theme.colors.paneCard : props.theme.colors.paneBG}
  :hover {
    background-color: ${props => props.theme.colors.paneCard};
  }
`;

const HTTPMethod = styled.span<{ method: string | undefined }>`
  flex: 1;
  font-size: 12px;
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
  padding: 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CreateNewButton = styled(BaseButton)`
  && {
    border: none;
    color: ${props => props.theme.colors.textOnDarkBG};
    height: 32px;
    &:hover {
      color: ${props => props.theme.colors.paneBG};
      svg {
        path {
          fill: ${props => props.theme.colors.paneBG};
        }
      }
    }
    svg {
      height: 12px;
    }
  }
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
    if (!this.props.actions.data.length) {
      this.props.fetchActions();
    }
  }

  handleCreateNew = () => {
    const { history } = this.props;
    history.push(API_EDITOR_URL);
  };

  render() {
    const { actions, history, match } = this.props;
    const activeActionId = match.params.id;
    return (
      <ApiSidebarWrapper>
        <ApiItemsWrapper>
          {actions.data.map(action => (
            <ApiItem
              key={action.id}
              onClick={() => history.push(API_EDITOR_ID_URL(action.id))}
              isSelected={activeActionId === action.id}
              className={actions.loading ? "bp3-skeleton" : ""}
            >
              <HTTPMethod method={action.actionConfiguration.httpMethod}>
                {action.actionConfiguration.httpMethod}
              </HTTPMethod>
              <ActionName>{action.name}</ActionName>
            </ApiItem>
          ))}
        </ApiItemsWrapper>
        <CreateNewButton
          text="Create new API"
          icon={FormIcons.ADD_NEW_ICON()}
          onClick={this.handleCreateNew}
        />
      </ApiSidebarWrapper>
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
