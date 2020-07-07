import React from "react";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { getFormValues, getFormInitialValues, change } from "redux-form";
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
} from "selectors/entitiesSelector";
import {
  PLUGIN_PACKAGE_DBS,
  QUERY_BODY_FIELD,
} from "constants/QueryEditorConstants";
import { QueryAction } from "entities/Action";
import { getPluginImage } from "pages/Editor/QueryEditor/helpers";

const EmptyStateContainer = styled.div`
  display: flex;
  height: 100%;
  font-size: 20px;
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
  selectedPluginPackage: string | undefined;
  isCreating: boolean;
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
      pluginIds,
      executedQueryData,
      selectedPluginPackage,
      isCreating,
      runErrorMessage,
    } = this.props;
    const { applicationId, pageId } = this.props.match.params;

    if (!pluginIds?.length) {
      return (
        <EmptyStateContainer>{"Plugin is not installed"}</EmptyStateContainer>
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
      image: getPluginImage(this.props.plugins, dataSource.pluginId),
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
            selectedPluginPackage={selectedPluginPackage}
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
  const datasourceId = _.get(formData, "datasource.id");
  const selectedPluginPackage = getPluginPackageFromDatasourceId(
    state,
    datasourceId,
  );

  return {
    plugins: getPlugins(state),
    runErrorMessage,
    pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
    dataSources: getDataSources(state),
    executedQueryData: state.ui.queryPane.runQuerySuccessData,
    queryPane: state.ui.queryPane,
    formData,
    selectedPluginPackage,
    isCreating: state.ui.queryPane.isCreating,
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
