import React from "react";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import {
  submit,
  getFormValues,
  getFormInitialValues,
  change,
} from "redux-form";
import _ from "lodash";
import styled from "styled-components";
import { QueryEditorRouteParams } from "constants/routes";
import QueryEditorForm from "./Form";
import QueryHomeScreen from "./QueryHomeScreen";
import { updateAction } from "actions/actionActions";
import { deleteQuery, executeQuery } from "actions/queryPaneActions";
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
import { getCurrentApplication } from "selectors/applicationSelectors";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import { QueryAction, RestAction } from "entities/Action";
import { getPluginImage } from "pages/Editor/QueryEditor/helpers";
import { ActionDraftsState } from "reducers/entityReducers/actionDraftsReducer";

const EmptyStateContainer = styled.div`
  display: flex;
  height: 100%;
  font-size: 20px;
`;

type QueryPageProps = {
  plugins: Plugin[];
  dataSources: Datasource[];
  queryPane: QueryPaneReduxState;
  formData: RestAction;
  isCreating: boolean;
  actionDrafts: ActionDraftsState;
  initialValues: RestAction;
  pluginIds: Array<string> | undefined;
  submitForm: (name: string) => void;
  createAction: (values: RestAction) => void;
  runAction: (action: RestAction, actionId: string) => void;
  runErrorMessage: Record<string, string>;
  deleteAction: (id: string) => void;
  updateAction: (data: RestAction) => void;
  createTemplate: (template: string) => void;
  executedQueryData: any;
  selectedPluginPackage: string;
};

type StateAndRouteProps = RouteComponentProps<QueryEditorRouteParams>;

type Props = QueryPageProps & StateAndRouteProps;

class QueryEditor extends React.Component<Props> {
  handleSubmit = () => {
    const { formData } = this.props;
    this.props.updateAction(formData);
  };

  handleSaveClick = () => {
    this.props.submitForm(QUERY_EDITOR_FORM_NAME);
  };

  handleDeleteClick = () => {
    const { queryId } = this.props.match.params;
    this.props.deleteAction(queryId);
  };

  handleRunClick = () => {
    const { formData, match } = this.props;
    const payload = { ...formData };

    this.props.runAction(payload, match.params.queryId);
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
      actionDrafts,
      isCreating,
      runErrorMessage,
    } = this.props;
    const { applicationId, pageId } = this.props.match.params;

    if (!pluginIds?.length) {
      return (
        <EmptyStateContainer>{"Plugin is not installed"}</EmptyStateContainer>
      );
    }
    const { isSaving, isRunning, isDeleting } = queryPane;

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
            isCreating={isCreating}
            location={this.props.location}
            applicationId={applicationId}
            pageId={pageId}
            allowSave={queryId in actionDrafts}
            isSaving={isSaving[queryId]}
            isRunning={isRunning[queryId]}
            isDeleting={isDeleting[queryId]}
            onSubmit={this.handleSubmit}
            onSaveClick={this.handleSaveClick}
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

const mapStateToProps = (state: AppState): any => {
  const { runErrorMessage } = state.ui.queryPane;
  const formData = getFormValues(QUERY_EDITOR_FORM_NAME)(state) as QueryAction;
  const initialValues = getFormInitialValues(QUERY_EDITOR_FORM_NAME)(
    state,
  ) as RestAction;
  const datasourceId = _.get(formData, "datasource.id");
  const selectedPluginPackage = getPluginPackageFromDatasourceId(
    state,
    datasourceId,
  );

  return {
    plugins: getPlugins(state),
    runErrorMessage,
    actionDrafts: state.entities.actionDrafts,
    pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
    dataSources: getDataSources(state),
    executedQueryData: state.ui.queryPane.runQuerySuccessData,
    queryPane: state.ui.queryPane,
    currentApplication: getCurrentApplication(state),
    formData: getFormValues(QUERY_EDITOR_FORM_NAME)(state) as RestAction,
    selectedPluginPackage,
    initialValues,
    isCreating: state.ui.queryPane.isCreating,
  };
};

const mapDispatchToProps = (dispatch: any): any => ({
  submitForm: (name: string) => dispatch(submit(name)),
  updateAction: (data: RestAction) => dispatch(updateAction({ data })),
  deleteAction: (id: string) => dispatch(deleteQuery({ id })),
  runAction: (action: RestAction, actionId: string) =>
    dispatch(executeQuery({ action, actionId })),
  createTemplate: (template: any) => {
    dispatch(change(QUERY_EDITOR_FORM_NAME, QUERY_BODY_FIELD, template));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
