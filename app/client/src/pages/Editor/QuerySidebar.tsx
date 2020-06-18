import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import EditorSidebar from "pages/Editor/EditorSidebar";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";
import { QueryEditorRouteParams } from "constants/routes";
import { Datasource } from "api/DatasourcesApi";
import { getPluginImage } from "pages/Editor/QueryEditor/helpers";
import { Plugin } from "api/PluginApi";
import {
  createActionRequest,
  moveActionRequest,
  copyActionRequest,
} from "actions/actionActions";
import {
  deleteQuery,
  changeQuery,
  initQueryPane,
} from "actions/queryPaneActions";
import { getQueryActions, getPlugins } from "selectors/entitiesSelector";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getDataSources } from "selectors/editorSelectors";
import { QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import { RestAction } from "entities/Action";
import { Colors } from "constants/Colors";
import { ActionDraftsState } from "reducers/entityReducers/actionDraftsReducer";

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
  margin-left: 10px;
  max-width: 125px;
`;

const StyledImage = styled.img`
  height: 20px;
  width: 20px;

  svg {
    path {
      fill: ${Colors.WHITE};
    }
  }
`;

interface ReduxStateProps {
  plugins: Plugin[];
  queries: ActionDataState;
  apiPane: ApiPaneReduxState;
  actionDrafts: ActionDraftsState;
  actions: ActionDataState;
  dataSources: Datasource[];
}

interface ReduxDispatchProps {
  createAction: (data: Partial<RestAction>) => void;
  onQueryChange: (id: string, pluginType: string) => void;
  initQueryPane: (pluginType: string, urlId?: string) => void;
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
  RouteComponentProps<QueryEditorRouteParams>;

class QuerySidebar extends React.Component<Props> {
  componentDidMount(): void {
    this.props.initQueryPane(QUERY_CONSTANT, this.props.match.params.queryId);
  }

  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    if (
      Object.keys(nextProps.actionDrafts) !==
      Object.keys(this.props.actionDrafts)
    ) {
      return true;
    }
    return nextProps.actions !== this.props.actions;
  }

  handleCreateNew = () => {
    const { actions } = this.props;
    const { pageId } = this.props.match.params;
    const pageApiNames = actions
      .filter(a => a.config.pageId === pageId)
      .map(a => a.config.name);
    const newName = getNextEntityName("Query", pageApiNames);
    this.props.createAction({ name: newName, pageId });
  };

  handleCreateNewQuery = (dataSourceId: string, pageId: string) => {
    const { actions } = this.props;
    const pageApiNames = actions
      .filter(a => a.config.pageId === pageId)
      .map(a => a.config.name);
    const newQueryName = getNextEntityName("Query", pageApiNames);
    this.props.createAction({
      name: newQueryName,
      pageId,
      datasource: {
        id: dataSourceId,
      },
    });
  };

  handleCreateNewQueryClick = (selectedPageId: string) => {
    const { history } = this.props;
    const { pageId, applicationId } = this.props.match.params;
    history.push(
      QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(
        applicationId,
        pageId,
        selectedPageId,
      ),
    );
  };

  handleQueryChange = (queryId: string) => {
    this.props.onQueryChange(queryId, QUERY_CONSTANT);
  };

  handleMove = (itemId: string, destinationPageId: string) => {
    const query = this.props.queries.filter(a => a.config.id === itemId)[0];
    const pageApiNames = this.props.queries
      .filter(a => a.config.pageId === destinationPageId)
      .map(a => a.config.name);
    let name = query.config.name;
    if (pageApiNames.indexOf(query.config.name) > -1) {
      name = getNextEntityName(name, pageApiNames);
    }
    this.props.moveAction(itemId, destinationPageId, name, query.config.pageId);
  };

  handleCopy = (itemId: string, destinationPageId: string) => {
    const query = this.props.queries.filter(a => a.config.id === itemId)[0];
    const pageApiNames = this.props.queries
      .filter(a => a.config.pageId === destinationPageId)
      .map(a => a.config.name);
    let name = `${query.config.name}Copy`;
    if (pageApiNames.indexOf(name) > -1) {
      name = getNextEntityName(name, pageApiNames);
    }
    this.props.copyAction(itemId, destinationPageId, name);
  };

  handleDelete = (itemId: string) => {
    this.props.deleteAction(itemId);
  };

  renderItem = (query: RestAction) => {
    return (
      <ActionItem>
        <StyledImage
          src={getPluginImage(this.props.plugins, query.pluginId)}
          className="pluginImage"
          alt="Plugin Image"
        />
        <ActionName>{query.name}</ActionName>
      </ActionItem>
    );
  };

  render() {
    const {
      actionDrafts,
      apiPane: { isFetching },
      match: {
        params: { queryId },
      },
      queries,
    } = this.props;
    const data = queries.map(a => a.config);

    return (
      <EditorSidebar
        isLoading={isFetching}
        list={data}
        selectedItemId={queryId}
        draftIds={Object.keys(actionDrafts)}
        itemRender={this.renderItem}
        onItemCreateClick={this.handleCreateNewQueryClick}
        onItemSelected={this.handleQueryChange}
        moveItem={this.handleMove}
        copyItem={this.handleCopy}
        deleteItem={this.handleDelete}
        createButtonTitle="Create new query"
      />
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  plugins: getPlugins(state),
  queries: getQueryActions(state),
  actionDrafts: state.entities.actionDrafts,
  apiPane: state.ui.apiPane,
  actions: state.entities.actions,
  dataSources: getDataSources(state),
});

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  createAction: (data: Partial<RestAction>) =>
    dispatch(createActionRequest(data)),
  onQueryChange: (queryId: string, pluginType: string) => {
    dispatch(changeQuery(queryId, pluginType));
  },
  initQueryPane: (pluginType: string, urlId?: string) =>
    dispatch(initQueryPane(pluginType, urlId)),
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
  deleteAction: (id: string) => dispatch(deleteQuery({ id })),
});

export default connect(mapStateToProps, mapDispatchToProps)(QuerySidebar);
