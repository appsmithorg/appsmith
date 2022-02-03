import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import { Plugin } from "api/PluginApi";
import {
  getDatasourcesByPluginId,
  getPluginByPackageName,
} from "selectors/entitiesSelector";
import NotFound from "pages/common/NotFound";
import { AppState } from "reducers";
import { createDatasourceFromForm } from "actions/datasourceActions";
import { SaaSAction } from "entities/Action";
import { createActionRequest } from "actions/pluginActionActions";
import { Datasource } from "entities/Datasource";
import { createNewApiName } from "utils/AppsmithUtils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";

// Design
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import styled from "styled-components";
import { Spinner, Button } from "@blueprintjs/core";
import DatasourceCard from "pages/Editor/SaaSEditor/DatasourceCard";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";

const IntegrationHomePage = styled.div`
  padding: 20px;
  padding-top: 30px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1;

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const AddDatasource = styled(Button)`
  padding: 23px;
  border: 2px solid #d6d6d6;
  justify-content: flex-start;
  font-size: 16px;
  font-weight: 500;
`;

const Boundary = styled.hr`
  border: 1px solid #d0d7dd;
  margin-top: 16px;
`;

interface StateProps {
  plugin?: Plugin;
  actions: ActionDataState;
  datasources: Datasource[];
  isCreating: boolean;
  isEditorInitialized: boolean;
  applicationId: string;
}

interface DispatchFunctions {
  createDatasource: (data: any) => void;
  createAction: (data: Partial<SaaSAction>) => void;
}

type RouteProps = RouteComponentProps<{
  pageId: string;
  pluginPackageName: string;
}>;

type Props = StateProps & DispatchFunctions & RouteProps;
class ListView extends React.Component<Props> {
  handleCreateNewDatasource = (pluginId: string) => {
    this.props.createDatasource({ pluginId });
  };

  handleCreateNewAPI = (datasource: Datasource) => {
    const {
      actions,
      location,
      match: {
        params: { pageId },
      },
    } = this.props;
    const params: string = location.search;
    let pgId = new URLSearchParams(params).get("importTo");
    if (!pgId) {
      pgId = pageId;
    }
    if (pgId) {
      const newApiName = createNewApiName(actions, pgId);

      this.props.createAction({
        name: newApiName,
        pageId: pgId,
        pluginId: datasource.pluginId,
        datasource: {
          id: datasource.id,
        },
      });
    }
  };

  render() {
    const { isCreating, isEditorInitialized, plugin } = this.props;
    if (!plugin) {
      return this.renderNotFound();
    }
    if (isCreating || !isEditorInitialized) {
      return this.renderLoading();
    }
    return this.renderPage();
  }

  renderPage() {
    const { datasources, plugin } = this.props;
    if (!plugin) {
      return this.renderNotFound();
    }
    return (
      <IntegrationHomePage>
        <p className="sectionHeader">Select a datasource or create a new one</p>
        <Boundary />

        <AddDatasource
          className="t--add-datasource"
          fill
          icon={"plus"}
          minimal
          onClick={() => this.handleCreateNewDatasource(plugin.id)}
          text="New Datasource"
        />

        {datasources.map((datasource) => {
          return (
            <DatasourceCard
              datasource={datasource}
              key={datasource.id}
              onCreate={this.handleCreateNewAPI}
            />
          );
        })}
      </IntegrationHomePage>
    );
  }

  renderLoading() {
    return (
      <LoadingContainer>
        <Spinner size={30} />
      </LoadingContainer>
    );
  }

  renderNotFound() {
    const {
      applicationId,
      history,
      match: {
        params: { pageId },
      },
    } = this.props;
    return (
      <IntegrationHomePage>
        <NotFound
          buttonText="Go back to Datasources"
          onBackButton={() =>
            history.push(
              INTEGRATION_EDITOR_URL(
                applicationId,
                pageId,
                INTEGRATION_TABS.ACTIVE,
              ),
            )
          }
          title="Datasources/Queries Not found"
        />
      </IntegrationHomePage>
    );
  }
}

const mapStateToProps = (state: AppState, props: RouteProps): StateProps => {
  const plugin = getPluginByPackageName(
    state,
    props.match.params.pluginPackageName,
  );
  let datasources: Datasource[] = [];
  if (plugin) {
    datasources = getDatasourcesByPluginId(state, plugin.id);
  }
  return {
    plugin,
    actions: state.entities.actions,
    isCreating: state.ui.apiPane.isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
    datasources: datasources,
    applicationId: getCurrentApplicationId(state),
  };
};

const mapDispatchToProps = (dispatch: any): DispatchFunctions => {
  return {
    createDatasource: (data: any) => dispatch(createDatasourceFromForm(data)),
    createAction: (data: Partial<SaaSAction>) => {
      dispatch(createActionRequest(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ListView);
