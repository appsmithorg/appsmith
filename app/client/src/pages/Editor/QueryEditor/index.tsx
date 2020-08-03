import React from "react";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import { QueryEditorRouteParams } from "constants/routes";
import QueryEditorForm from "./Form";
import QueryHomeScreen from "./QueryHomeScreen";
import { deleteAction, runAction } from "actions/actionActions";
import { AppState } from "reducers";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Plugin } from "api/PluginApi";
import { Datasource } from "api/DatasourcesApi";
import { QueryPaneReduxState } from "reducers/uiReducers/queryPaneReducer";
import {
  getPluginIdsOfPackageNames,
  getPlugins,
  getPluginImages,
  getDBDatasources,
  getAction,
} from "selectors/entitiesSelector";
import {
  PLUGIN_PACKAGE_DBS,
  QUERY_BODY_FIELD,
} from "constants/QueryEditorConstants";
import { QueryAction } from "entities/Action";
import Spinner from "components/editorComponents/Spinner";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

const EmptyStateContainer = styled.div`
  display: flex;
  height: 100%;
  font-size: 20px;
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

type ReduxDispatchProps = {
  runAction: (actionId: string) => void;
  deleteAction: (id: string, name: string) => void;
};

type ReduxStateProps = {
  plugins: Plugin[];
  dataSources: Datasource[];
  queryPane: QueryPaneReduxState;
  formData: QueryAction;
  runErrorMessage: Record<string, string>;
  pluginIds: Array<string> | undefined;
  executedQueryData: any;
  isCreating: boolean;
  isMoving: boolean;
  isCopying: boolean;
  pluginImages: Record<string, string>;
  editorConfig: [];
  loadingFormConfigs: boolean;
};

type StateAndRouteProps = RouteComponentProps<QueryEditorRouteParams>;

type Props = StateAndRouteProps & ReduxDispatchProps & ReduxStateProps;

class QueryEditor extends React.Component<Props> {
  handleDeleteClick = () => {
    const { queryId } = this.props.match.params;
    const { formData } = this.props;
    this.props.deleteAction(queryId, formData.name);
  };

  handleRunClick = () => {
    const { match } = this.props;
    this.props.runAction(match.params.queryId);
  };

  render() {
    const {
      dataSources,
      queryPane,
      match: {
        params: { queryId },
      },
      pluginImages,
      pluginIds,
      executedQueryData,
      isCreating,
      isMoving,
      isCopying,
      runErrorMessage,
      loadingFormConfigs,
      editorConfig,
    } = this.props;
    const { applicationId, pageId } = this.props.match.params;

    if (!pluginIds?.length) {
      return (
        <EmptyStateContainer>{"Plugin is not installed"}</EmptyStateContainer>
      );
    }

    if (isCreating || isCopying || isMoving) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }
    const { isRunning, isDeleting } = queryPane;

    const DATASOURCES_OPTIONS = dataSources.map(dataSource => ({
      label: dataSource.name,
      value: dataSource.id,
      image: pluginImages[dataSource.pluginId],
    }));

    return (
      <React.Fragment>
        {queryId ? (
          <QueryEditorForm
            location={this.props.location}
            applicationId={applicationId}
            pageId={pageId}
            isRunning={isRunning[queryId]}
            isDeleting={isDeleting[queryId]}
            onDeleteClick={this.handleDeleteClick}
            onRunClick={this.handleRunClick}
            dataSources={dataSources}
            editorConfig={editorConfig}
            loadingFormConfigs={loadingFormConfigs}
            DATASOURCES_OPTIONS={DATASOURCES_OPTIONS}
            executedQueryData={executedQueryData[queryId]}
            runErrorMessage={runErrorMessage[queryId]}
          />
        ) : (
          <QueryHomeScreen
            dataSources={dataSources}
            applicationId={applicationId}
            pageId={pageId}
            history={this.props.history}
            location={this.props.location}
            isCreating={isCreating}
          />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const { runErrorMessage } = state.ui.queryPane;
  const { plugins } = state.entities;
  const { editorConfigs, loadingFormConfigs } = plugins;
  const formData = getFormValues(QUERY_EDITOR_FORM_NAME)(state) as QueryAction;
  const queryAction = getAction(state, props.match.params.queryId);

  return {
    pluginImages: getPluginImages(state),
    plugins: getPlugins(state),
    runErrorMessage,
    pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
    dataSources: getDBDatasources(state),
    executedQueryData: state.ui.queryPane.runQuerySuccessData,
    queryPane: state.ui.queryPane,
    formData,
    editorConfig: queryAction?.pluginId
      ? editorConfigs[queryAction.pluginId]
      : [],
    loadingFormConfigs,
    isCreating: state.ui.apiPane.isCreating,
    isMoving: state.ui.apiPane.isMoving,
    isCopying: state.ui.apiPane.isCopying,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  runAction: (actionId: string) => dispatch(runAction(actionId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
