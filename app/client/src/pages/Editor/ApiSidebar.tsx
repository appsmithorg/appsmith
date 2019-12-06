import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { API_EDITOR_URL, APIEditorRouteParams } from "constants/routes";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { FormIcons } from "icons/FormIcons";
import { Spinner } from "@blueprintjs/core";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import { TICK } from "@blueprintjs/icons/lib/esm/generated/iconNames";
import { createActionRequest } from "actions/actionActions";
import { changeApi, initApiPane } from "actions/apiPaneActions";
import { RestAction } from "api/ActionAPI";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Fuse from "fuse.js";
import { getPluginIdOfName } from "selectors/entitiesSelector";
import { PLUGIN_NAME } from "constants/ApiEditorConstants";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const ApiSidebarWrapper = styled.div`
  margin-top: 10px;
  height: 100%;
  width: 100%;
  flex-direction: column;
`;

const SearchBar = styled(BaseTextInput)`
  margin-bottom: 10px;
  input {
    background-color: #23292e;
    border: none;
    color: ${props => props.theme.colors.textOnDarkBG}
    :focus {
      background-color: #23292e;
    }
  }
  .bp3-icon {
    background-color: #23292e;
  }
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

const HTTPMethod = styled.span<{ method?: string }>`
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

const DraftIconIndicator = styled.span<{ isHidden: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  background-color: #f2994a;
  opacity: ${({ isHidden }) => (isHidden ? 0 : 1)};
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
  pluginId: string | undefined;
}

interface ReduxDispatchProps {
  createAction: (name: string) => void;
  onApiChange: (id: string) => void;
  initApiPane: (urlId?: string) => void;
}

type Props = ReduxStateProps &
  ReduxDispatchProps &
  RouteComponentProps<APIEditorRouteParams>;
type State = {
  isCreating: boolean;
  name: string;
  search: string;
};

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  minMatchCharLength: 3,
  findAllMatches: true,
  keys: ["name"],
};

class ApiSidebar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isCreating: false,
      name: "",
      search: "",
    };
  }

  componentDidMount(): void {
    this.props.initApiPane(this.props.match.params.apiId);
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    // If url has changed, hide the create input
    if (!prevProps.match.params.apiId && this.props.match.params.apiId) {
      this.setState({
        isCreating: false,
        name: "",
      });
    }
  }

  handleCreateNew = () => {
    const { history, actions } = this.props;
    const { pageId, applicationId } = this.props.match.params;

    history.push(API_EDITOR_URL(applicationId, pageId));
    this.setState({
      isCreating: true,
      name: `action${actions.data.length}`,
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

  handleSearchChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
    this.setState({
      search: value,
    });
  };

  handleApiChange = (actionId: string) => {
    this.props.onApiChange(actionId);
  };

  render() {
    const {
      apiPane: { isFetching, isSaving, drafts },
      match,
      actions: { data },
      pluginId,
    } = this.props;
    if (!pluginId) return null;
    const { isCreating, search, name } = this.state;
    const activeActionId = match.params.apiId;
    const fuse = new Fuse(data, FUSE_OPTIONS);
    const actions: RestAction[] = search ? fuse.search(search) : data;
    return (
      <React.Fragment>
        {isFetching ? (
          <LoadingContainer>
            <Spinner size={30} />
          </LoadingContainer>
        ) : (
          <ApiSidebarWrapper>
            <ApiItemsWrapper>
              <SearchBar
                icon="search"
                input={{
                  value: search,
                  onChange: this.handleSearchChange,
                }}
                placeholder="Search"
              />
              {actions.map(action => (
                <ApiItem
                  key={action.id}
                  onClick={() => this.handleApiChange(action.id)}
                  isSelected={activeActionId === action.id}
                >
                  {action.actionConfiguration ? (
                    <HTTPMethod method={action.actionConfiguration.httpMethod}>
                      {action.actionConfiguration.httpMethod}
                    </HTTPMethod>
                  ) : (
                    <HTTPMethod />
                  )}
                  <ActionName>{action.name}</ActionName>
                  <DraftIconIndicator isHidden={!(action.id in drafts)} />
                </ApiItem>
              ))}
            </ApiItemsWrapper>
            {isCreating ? (
              <CreateApiWrapper>
                <BaseTextInput
                  placeholder="API name"
                  input={{
                    value: name,
                    onChange: this.handleNameChange,
                  }}
                />
                <BaseButton
                  icon={TICK}
                  accent="primary"
                  text=""
                  onClick={this.saveAction}
                  filled
                  loading={isSaving}
                />
              </CreateApiWrapper>
            ) : (
              <React.Fragment>
                {!isFetching && (
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
  pluginId: getPluginIdOfName(state, PLUGIN_NAME),
  actions: state.entities.actions,
  apiPane: state.ui.apiPane,
});

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  createAction: (name: string) => dispatch(createActionRequest({ name })),
  onApiChange: (actionId: string) => dispatch(changeApi(actionId)),
  initApiPane: (urlId?: string) => dispatch(initApiPane(urlId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ApiSidebar);
