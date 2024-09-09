import React from "react";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router";
import type { Plugin } from "api/PluginApi";
import {
  getDatasourcesByPluginId,
  getPluginByPackageName,
} from "ee/selectors/entitiesSelector";
import NotFound from "pages/common/NotFound";
import type { AppState } from "ee/reducers";
import { createDatasourceFromForm } from "actions/datasourceActions";
import type { SaaSAction } from "entities/Action";
import { createActionRequest } from "actions/pluginActionActions";
import type { Datasource } from "entities/Datasource";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";

// Design
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import styled from "styled-components";
import { Spinner, Button } from "@blueprintjs/core";
import DatasourceCard from "pages/Editor/SaaSEditor/DatasourceCard";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  selectURLSlugs,
} from "selectors/editorSelectors";
import { INTEGRATION_TABS } from "constants/routes";
import { integrationEditorURL } from "ee/RouteBuilder";

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
  applicationSlug: string;
  pageSlug: string;
}

interface DispatchFunctions {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createDatasource: (data: any) => void;
  createAction: (data: Partial<SaaSAction>) => void;
}

type RouteProps = RouteComponentProps<{
  basePageId: string;
  pluginPackageName: string;
}>;

type Props = StateProps & DispatchFunctions & RouteProps;
class ListView extends React.Component<Props> {
  handleCreateNewDatasource = (pluginId: string) => {
    this.props.createDatasource({ pluginId });
  };

  handleCreateNewAPI = (datasource: Datasource) => {
    const {
      location,
      match: {
        params: { basePageId },
      },
    } = this.props;
    const params: string = location.search;
    let pgId = new URLSearchParams(params).get("importTo");
    if (!pgId) {
      pgId = basePageId;
    }
    if (pgId) {
      this.props.createAction({
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
          text="New datasource"
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
      history,
      match: {
        params: { basePageId },
      },
    } = this.props;
    return (
      <IntegrationHomePage>
        <NotFound
          buttonText="Go back to Datasources"
          onBackButton={() =>
            history.push(
              integrationEditorURL({
                basePageId,
                selectedTab: INTEGRATION_TABS.ACTIVE,
              }),
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
  const { applicationSlug, pageSlug } = selectURLSlugs(state);
  return {
    plugin,
    actions: state.entities.actions,
    isCreating: state.ui.apiPane.isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
    datasources: datasources,
    applicationId: getCurrentApplicationId(state),
    applicationSlug,
    pageSlug,
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): DispatchFunctions => {
  return {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createDatasource: (data: any) => dispatch(createDatasourceFromForm(data)),
    createAction: (data: Partial<SaaSAction>) => {
      dispatch(createActionRequest(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ListView);
