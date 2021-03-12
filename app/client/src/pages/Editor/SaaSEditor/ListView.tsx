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
import {
  createDatasourceFromForm,
  selectPlugin,
} from "actions/datasourceActions";
import { SaaSAction } from "entities/Action";
import { createActionRequest } from "actions/actionActions";
import { Datasource } from "entities/Datasource";
import { createNewApiName } from "utils/AppsmithUtils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";

// Design
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import styled from "styled-components";
import { Spinner, Button } from "@blueprintjs/core";
import DatasourceCard from "pages/Editor/SaaSEditor/DatasourceCard";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import { API_EDITOR_URL } from "constants/routes";
import { fetchPluginForm } from "actions/pluginActions";

const IntegrationHomePage = styled.div`
  padding: 20px;
  padding-top: 30px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});

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
}

interface DispatchFunctions {
  createDatasource: (data: any) => void;
  selectPlugin: (pluginId: string) => void;
  createAction: (data: Partial<SaaSAction>) => void;
  fetchPluginForm: (id: string) => void;
}

type RouteProps = RouteComponentProps<{
  applicationId: string;
  pageId: string;
  pluginPackageName: string;
}>;

type Props = StateProps & DispatchFunctions & RouteProps;
class ListView extends React.Component<Props> {
  componentDidMount() {
    if (this.props.plugin?.id) {
      this.props.fetchPluginForm(this.props.plugin.id);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.plugin?.id &&
      prevProps.plugin?.id !== this.props.plugin?.id
    ) {
      this.props.fetchPluginForm(this.props.plugin.id);
    }
  }

  handleCreateNewDatasource = (pluginId: string) => {
    this.props.selectPlugin(pluginId);
    this.props.createDatasource({ pluginId });
  };

  handleCreateNewAPI = (datasource: Datasource) => {
    const { actions, location } = this.props;
    const params: string = location.search;
    const pageId = new URLSearchParams(params).get("importTo");

    if (pageId) {
      const newApiName = createNewApiName(actions, pageId);

      this.props.createAction({
        name: newApiName,
        pageId: pageId,
        pluginId: datasource.pluginId,
        datasource: {
          id: datasource.id,
        },
      });
    }
  };

  render() {
    const { plugin, isCreating, isEditorInitialized } = this.props;
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
          onClick={() => this.handleCreateNewDatasource(plugin.id)}
          fill
          minimal
          text="New Datasource"
          icon={"plus"}
        />

        {datasources.map((datasource) => {
          return (
            <DatasourceCard
              key={datasource.id}
              datasource={datasource}
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
      match: {
        params: { applicationId, pageId },
      },
      history,
    } = this.props;
    return (
      <IntegrationHomePage>
        <NotFound
          title="Integration Not found"
          buttonText="Go back to Integrations"
          onBackButton={() =>
            history.push(API_EDITOR_URL(applicationId, pageId))
          }
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
  };
};

const mapDispatchToProps = (dispatch: any): DispatchFunctions => {
  return {
    selectPlugin: (pluginId: string) => dispatch(selectPlugin(pluginId)),
    createDatasource: (data: any) => dispatch(createDatasourceFromForm(data)),
    fetchPluginForm: (id: string) => dispatch(fetchPluginForm({ id })),
    createAction: (data: Partial<SaaSAction>) => {
      dispatch(createActionRequest(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ListView);
