import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { APIEditorRouteParams } from "constants/routes";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import {
  createActionRequest,
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/actionActions";
import { changeApi, initApiPane } from "actions/apiPaneActions";
import { RestAction } from "api/ActionAPI";
import { getPluginIdOfName } from "selectors/entitiesSelector";
import { DEFAULT_API_ACTION, PLUGIN_NAME } from "constants/ApiEditorConstants";
import EditorSidebar from "pages/Editor/EditorSidebar";
import { getNextEntityName } from "utils/AppsmithUtils";

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

const ActionItem = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const ActionName = styled.span`
  flex: 3;
  padding: 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  apiPane: ApiPaneReduxState;
  pluginId: string | undefined;
}

interface ReduxDispatchProps {
  createAction: (data: Partial<RestAction>) => void;
  onApiChange: (id: string) => void;
  initApiPane: (urlId?: string) => void;
  moveAction: (
    id: string,
    pageId: string,
    name: string,
    originalPageId: string,
  ) => void;
  copyAction: (id: string, pageId: string, name: string) => void;
  deleteAction: (id: string) => void;
}

type Props = ReduxStateProps &
  ReduxDispatchProps &
  RouteComponentProps<APIEditorRouteParams>;

class ApiSidebar extends React.Component<Props> {
  componentDidMount(): void {
    this.props.initApiPane(this.props.match.params.apiId);
  }

  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    if (
      Object.keys(nextProps.apiPane.drafts) !==
      Object.keys(this.props.apiPane.drafts)
    ) {
      return true;
    }
    return nextProps.actions.data !== this.props.actions.data;
  }

  handleCreateNew = () => {
    const { actions } = this.props;
    const { pageId } = this.props.match.params;
    const pageApiNames = actions.data
      .filter(a => a.pageId === pageId)
      .map(a => a.name);
    const newName = getNextEntityName("Api", pageApiNames);
    this.props.createAction({ ...DEFAULT_API_ACTION, name: newName, pageId });
  };

  handleApiChange = (actionId: string) => {
    this.props.onApiChange(actionId);
  };

  handleMove = (itemId: string, destinationPageId: string) => {
    const action = this.props.actions.data.filter(a => a.id === itemId)[0];
    const pageApiNames = this.props.actions.data
      .filter(a => a.pageId === destinationPageId)
      .map(a => a.name);
    let name = action.name;
    if (pageApiNames.indexOf(action.name) > -1) {
      name = getNextEntityName(`${name}-`, pageApiNames);
    }
    this.props.moveAction(itemId, destinationPageId, name, action.pageId);
  };

  handleCopy = (itemId: string, destinationPageId: string) => {
    const action = this.props.actions.data.filter(a => a.id === itemId)[0];
    const pageApiNames = this.props.actions.data
      .filter(a => a.pageId === destinationPageId)
      .map(a => a.name);
    let name = `${action.name}Copy`;
    if (pageApiNames.indexOf(name) > -1) {
      name = getNextEntityName(`${name}`, pageApiNames);
    }
    this.props.copyAction(itemId, destinationPageId, name);
  };

  handleDelete = (itemId: string) => {
    this.props.deleteAction(itemId);
  };

  renderItem = (action: RestAction) => {
    return (
      <ActionItem>
        {action.actionConfiguration ? (
          <HTTPMethod method={action.actionConfiguration.httpMethod}>
            {action.actionConfiguration.httpMethod}
          </HTTPMethod>
        ) : (
          <HTTPMethod />
        )}
        <ActionName>{action.name}</ActionName>
      </ActionItem>
    );
  };

  render() {
    const {
      apiPane: { isFetching, drafts },
      match: {
        params: { apiId },
      },
      actions: { data },
      pluginId,
    } = this.props;
    if (!pluginId) return null;
    return (
      <EditorSidebar
        isLoading={isFetching}
        list={data}
        selectedItemId={apiId}
        draftIds={Object.keys(drafts)}
        itemRender={this.renderItem}
        onItemCreateClick={this.handleCreateNew}
        onItemSelected={this.handleApiChange}
        moveItem={this.handleMove}
        copyItem={this.handleCopy}
        deleteItem={this.handleDelete}
      />
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  pluginId: getPluginIdOfName(state, PLUGIN_NAME),
  actions: state.entities.actions,
  apiPane: state.ui.apiPane,
});

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  createAction: (data: Partial<RestAction>) =>
    dispatch(createActionRequest(data)),
  onApiChange: (actionId: string) => dispatch(changeApi(actionId)),
  initApiPane: (urlId?: string) => dispatch(initApiPane(urlId)),
  moveAction: (
    id: string,
    destinationPageId: string,
    name: string,
    originalPageId: string,
  ) =>
    dispatch(
      moveActionRequest({ id, destinationPageId, originalPageId, name }),
    ),
  copyAction: (id: string, destinationPageId: string, name: string) =>
    dispatch(copyActionRequest({ id, destinationPageId, name })),
  deleteAction: (id: string) => dispatch(deleteAction({ id })),
});

export default connect(mapStateToProps, mapDispatchToProps)(ApiSidebar);
