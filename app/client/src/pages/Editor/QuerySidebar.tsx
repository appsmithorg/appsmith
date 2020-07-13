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
import ImageAlt from "assets/images/placeholder-image.svg";
import {
  createActionRequest,
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/actionActions";
import { changeQuery, initQueryPane } from "actions/queryPaneActions";
import { getQueryActions, getPluginImages } from "selectors/entitiesSelector";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getDataSources } from "selectors/editorSelectors";
import { QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import { RestAction } from "entities/Action";
import { Colors } from "constants/Colors";

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
  pluginImages: Record<string, string>;
  queries: ActionDataState;
  apiPane: ApiPaneReduxState;
  actions: ActionDataState;
  dataSources: Datasource[];
}

interface ReduxDispatchProps {
  createAction: (data: Partial<RestAction>) => void;
  onQueryChange: (id: string) => void;
  initQueryPane: (pluginType: string, urlId?: string) => void;
  moveAction: (
    id: string,
    pageId: string,
    name: string,
    originalPageId: string,
  ) => void;
  copyAction: (id: string, pageId: string, name: string) => void;
  deleteAction: (id: string, name: string) => void;
}

type Props = ReduxStateProps &
  ReduxDispatchProps &
  RouteComponentProps<QueryEditorRouteParams>;

class QuerySidebar extends React.Component<Props> {
  componentDidMount(): void {
    this.props.initQueryPane(QUERY_CONSTANT, this.props.match.params.queryId);
  }

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
    this.props.onQueryChange(queryId);
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

  handleDelete = (itemId: string, itemName: string) => {
    this.props.deleteAction(itemId, itemName);
  };

  renderItem = (query: RestAction) => {
    const { pluginImages } = this.props;

    return (
      <ActionItem>
        <StyledImage
          src={pluginImages[query.datasource?.pluginId ?? ""] || ImageAlt}
          className="pluginImage"
          alt="Plugin Image"
        />
        <ActionName>{query.name}</ActionName>
      </ActionItem>
    );
  };

  render() {
    const {
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
  pluginImages: getPluginImages(state),
  queries: getQueryActions(state),
  apiPane: state.ui.apiPane,
  actions: state.entities.actions,
  dataSources: getDataSources(state),
});

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  createAction: (data: Partial<RestAction>) =>
    dispatch(createActionRequest(data)),
  onQueryChange: (queryId: string) => {
    dispatch(changeQuery(queryId));
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
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
});

export default connect(mapStateToProps, mapDispatchToProps)(QuerySidebar);
