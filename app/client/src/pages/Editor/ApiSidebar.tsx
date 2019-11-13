import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "../../reducers";
import { ActionDataState } from "../../reducers/entityReducers/actionsReducer";
import { API_EDITOR_ID_URL, API_EDITOR_URL } from "../../constants/routes";
import { BaseButton } from "../../components/designSystems/blueprint/ButtonComponent";
import { FormIcons } from "../../icons/FormIcons";
import { Spinner } from "@blueprintjs/core";
import { ApiPaneReduxState } from "../../reducers/uiReducers/apiPaneReducer";
import { BaseTextInput } from "../../components/designSystems/appsmith/TextInputComponent";
import { TICK } from "@blueprintjs/icons/lib/esm/generated/iconNames";
import { createActionRequest } from "../../actions/actionActions";

const LoadingContainer = styled.div`
  height: 50%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ApiSidebarWrapper = styled.div`
  margin-top: 10px;
  height: 100%;
  width: 100%;
  flex-direction: column;
`;
const ApiItemsWrapper = styled.div`
  flex: 1;
  margin-bottom: 15px;
`;

const ApiItem = styled.div<{ isSelected: boolean }>`
  height: 32px;
  width: 100%;
  padding: 8px 12px;
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
    text-align: left;
    justify-content: flex-start;
    &:hover {
      color: ${props => props.theme.colors.paneBG};
      svg {
        path {
          fill: ${props => props.theme.colors.paneBG};
        }
      }
    }
    svg {
      margin-top: 4px;
      height: 14px;
      width: 14px;
    }
  }
`;

const CreateApiWrapper = styled.div`
  display: grid;
  grid-template-columns: 6fr 1fr;
  grid-gap: 5px;
  height: 32px;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  apiPane: ApiPaneReduxState;
}

interface ReduxDispatchProps {
  createAction: (name: string) => void;
}

type Props = ReduxStateProps &
  ReduxDispatchProps &
  RouteComponentProps<{ id: string }>;
type State = {
  isCreating: boolean;
  name: string;
};

class ApiSidebar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isCreating: false,
      name: "",
    };
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (!prevProps.match.params.id && this.props.match.params.id) {
      this.setState({
        isCreating: false,
        name: "",
      });
    }
  }

  handleCreateNew = () => {
    const { history } = this.props;
    history.push(API_EDITOR_URL);
    this.setState({
      isCreating: true,
      name: "",
    });
  };

  saveAction = () => {
    if (this.state.name) {
      this.props.createAction(this.state.name);
    } else {
      this.setState({
        isCreating: false,
      });
    }
  };

  handleNameChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
    this.setState({
      name: value,
    });
  };

  render() {
    const { actions, apiPane, history, match } = this.props;
    const { isCreating } = this.state;
    const activeActionId = match.params.id;
    return (
      <React.Fragment>
        {apiPane.isFetching ? (
          <LoadingContainer>
            <Spinner size={30} />
          </LoadingContainer>
        ) : (
          <ApiSidebarWrapper>
            <ApiItemsWrapper>
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
            </ApiItemsWrapper>
            {isCreating ? (
              <CreateApiWrapper>
                <BaseTextInput
                  placeholderMessage="API name"
                  input={{
                    value: this.state.name,
                    onChange: this.handleNameChange,
                  }}
                />
                <BaseButton
                  icon={TICK}
                  styleName="primary"
                  text=""
                  onClick={this.saveAction}
                  filled
                />
              </CreateApiWrapper>
            ) : (
              <React.Fragment>
                {!apiPane.isFetching && (
                  <CreateNewButton
                    text="Create new API"
                    icon={FormIcons.ADD_NEW_ICON()}
                    onClick={this.handleCreateNew}
                  />
                )}
              </React.Fragment>
            )}
          </ApiSidebarWrapper>
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  actions: state.entities.actions,
  apiPane: state.ui.apiPane,
});

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  createAction: (name: string) =>
    dispatch(
      createActionRequest({
        name,
      }),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ApiSidebar);
