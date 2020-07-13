import React from "react";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { getFormValues, change } from "redux-form";
import _ from "lodash";
import styled from "styled-components";
import { QueryEditorRouteParams } from "constants/routes";
import QueryEditorForm from "./Form";
import QueryHomeScreen from "./QueryHomeScreen";
import { deleteAction, runAction } from "actions/actionActions";
import { AppState } from "reducers";
import { getDataSources } from "selectors/editorSelectors";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Plugin } from "api/PluginApi";
import { Datasource } from "api/DatasourcesApi";
import { QueryPaneReduxState } from "reducers/uiReducers/queryPaneReducer";
import {
  getPluginIdsOfPackageNames,
  getPluginPackageFromDatasourceId,
  getPlugins,
  getPluginImages,
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
  createTemplate: (template: string) => void;
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
      createTemplate,
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

    const validDataSources: Array<Datasource> = [];
    dataSources.forEach(dataSource => {
      if (pluginIds?.includes(dataSource.pluginId)) {
        validDataSources.push(dataSource);
      }
    });

    const DATASOURCES_OPTIONS = validDataSources.map(dataSource => ({
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
            createTemplate={createTemplate}
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

const mapStateToProps = (state: AppState): ReduxStateProps => {
  const { runErrorMessage } = state.ui.queryPane;
  const formData = getFormValues(QUERY_EDITOR_FORM_NAME)(state) as QueryAction;

  return {
    pluginImages: getPluginImages(state),
    plugins: getPlugins(state),
    runErrorMessage,
    pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
    dataSources: getDataSources(state),
    executedQueryData: state.ui.queryPane.runQuerySuccessData,
    queryPane: state.ui.queryPane,
    formData,
    isCreating: state.ui.apiPane.isCreating,
    isMoving: state.ui.apiPane.isMoving,
    isCopying: state.ui.apiPane.isCopying,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  runAction: (actionId: string) => dispatch(runAction(actionId)),
  createTemplate: (template: any) => {
    dispatch(change(QUERY_EDITOR_FORM_NAME, QUERY_BODY_FIELD, template));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
