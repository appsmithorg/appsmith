import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  APIEditorRouteParams,
} from "constants/routes";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import {
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/actionActions";
import {
  changeApi,
  createNewApiAction,
  initApiPane,
} from "actions/apiPaneActions";
import { RestAction } from "api/ActionAPI";
import EditorSidebar from "pages/Editor/EditorSidebar";
import { getNextEntityName } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Page } from "constants/ReduxActionConstants";
import { checkForFlag, FeatureFlagEnum } from "utils/featureFlags";

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
      case "PATCH":
        return "#8E8E8E";
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
  max-width: 100px;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  apiPane: ApiPaneReduxState;
  pages: Page[];
}

interface ReduxDispatchProps {
  onApiChange: (id: string) => void;
  initApiPane: (urlId?: string) => void;
  moveAction: (
    id: string,
    pageId: string,
    name: string,
    originalPageId: string,
  ) => void;
  copyAction: (id: string, pageId: string, name: string) => void;
  deleteAction: (id: string, name: string) => void;
  createNewApiAction: (pageId: string) => void;
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
    return nextProps.actions !== this.props.actions;
  }

  handleApiChange = (actionId: string) => {
    this.props.onApiChange(actionId);
  };

  handleMove = (itemId: string, destinationPageId: string) => {
    const { pages } = this.props;
    const action = this.props.actions.filter(a => a.config.id === itemId)[0];
    const pageApiNames = this.props.actions
      .filter(a => a.config.pageId === destinationPageId)
      .map(a => a.config.name);
    let name = action.config.name;
    const page = pages.find(page => page.pageId === destinationPageId);

    AnalyticsUtil.logEvent("MOVE_API_CLICK", {
      apiId: itemId,
      apiName: name,
      pageName: page?.pageName,
    });
    if (pageApiNames.indexOf(action.config.name) > -1) {
      name = getNextEntityName(name, pageApiNames);
    }
    this.props.moveAction(
      itemId,
      destinationPageId,
      name,
      action.config.pageId,
    );
  };

  handleCopy = (itemId: string, destinationPageId: string) => {
    const { pages } = this.props;
    const action = this.props.actions.filter(a => a.config.id === itemId)[0];
    const pageApiNames = this.props.actions
      .filter(a => a.config.pageId === destinationPageId)
      .map(a => a.config.name);
    let name = `${action.config.name}Copy`;
    const page = pages.find(page => page.pageId === destinationPageId);

    AnalyticsUtil.logEvent("DUPLICATE_API_CLICK", {
      apiId: itemId,
      apiName: name,
      pageName: page?.pageName,
    });

    if (pageApiNames.indexOf(name) > -1) {
      name = getNextEntityName(name, pageApiNames);
    }
    this.props.copyAction(itemId, destinationPageId, name);
  };

  handleDelete = (itemId: string, itemName: string, pageName: string) => {
    AnalyticsUtil.logEvent("DELETE_API_CLICK", {
      apiId: itemId,
      apiName: itemName,
      pageName: pageName,
    });
    this.props.deleteAction(itemId, itemName);
  };

  renderItem = (action: RestAction) => {
    return (
      <ActionItem
        onClick={() => {
          AnalyticsUtil.logEvent("API_SELECT", {
            apiId: action.id,
            apiName: action.name,
          });
        }}
      >
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

  handleCreateNewApiClick = (selectedPageId: string) => {
    const { history, createNewApiAction } = this.props;
    const { pageId, applicationId } = this.props.match.params;
    const v2Flag = checkForFlag(FeatureFlagEnum.ApiPaneV2);
    if (v2Flag) {
      history.push(
        API_EDITOR_URL_WITH_SELECTED_PAGE_ID(
          applicationId,
          pageId,
          selectedPageId,
        ),
      );
    } else {
      createNewApiAction(selectedPageId);
    }
  };

  render() {
    const {
      apiPane: { isFetching, drafts },
      match: {
        params: { apiId },
      },
      actions,
    } = this.props;
    const data = actions.map(a => a.config).filter(a => a.pluginType === "API");
    return (
      <EditorSidebar
        isLoading={isFetching}
        list={data}
        selectedItemId={apiId}
        draftIds={Object.keys(drafts)}
        itemRender={this.renderItem}
        onItemCreateClick={this.handleCreateNewApiClick}
        onItemSelected={this.handleApiChange}
        moveItem={this.handleMove}
        copyItem={this.handleCopy}
        deleteItem={this.handleDelete}
        createButtonTitle="Create new API"
      />
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  actions: state.entities.actions,
  apiPane: state.ui.apiPane,
  pages: state.entities.pageList.pages,
});

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
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
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  createNewApiAction: (pageId: string) => dispatch(createNewApiAction(pageId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ApiSidebar);
