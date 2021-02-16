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
import { ApiAction } from "entities/Action";
import { createActionRequest } from "actions/actionActions";
import { Datasource } from "entities/Datasource";
import { createNewApiName } from "utils/AppsmithUtils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";

// Design
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import styled from "styled-components";
import { Spinner, Button } from "@blueprintjs/core";
import DatasourceCard from "./DatasourceCard";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import { API_EDITOR_URL } from "constants/routes";

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
  createAction: (data: Partial<ApiAction> & { eventData: any }) => void;
}

type RouteProps = RouteComponentProps<{
  applicationId: string;
  pageId: string;
  pluginPackageName: string;
}>;

type Props = StateProps & DispatchFunctions & RouteProps;
class Oauth2IntegrationEditor extends React.Component<Props> {
  handleCreateNewDatasource = (pluginId: string) => {
    this.props.selectPlugin(pluginId);
    this.props.createDatasource({ pluginId });
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleCreateNewAPI = (datasource: Datasource) => {
    const { actions, location } = this.props;
    const params: string = location.search;
    const pageId = new URLSearchParams(params).get("importTo");

    if (pageId) {
      // TODO: Ask Nidhi to give me a prefix as part of a plugin
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const newQueryName = createNewApiName(actions, pageId);
      //const data: any = {};
      //this.props.createAction(data);
    }
  };

  render() {
    const {
      match: {
        params: { applicationId, pageId },
      },
      plugin,
      isCreating,
      isEditorInitialized,
      datasources,
      history,
    } = this.props;
    if (!plugin) {
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
    if (isCreating || !isEditorInitialized) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
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
    createAction: (data: Partial<ApiAction> & { eventData: any }) => {
      dispatch(createActionRequest(data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Oauth2IntegrationEditor);
