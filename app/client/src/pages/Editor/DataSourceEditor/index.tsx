import React from "react";
import { connect } from "react-redux";
import { getFormValues, submit } from "redux-form";
import { AppState } from "reducers";
import { getPluginPackageFromId } from "selectors/entitiesSelector";
import { updateDatasource, testDatasource } from "actions/datasourceActions";
import { DATASOURCE_DB_FORM } from "constants/forms";
import DatasourceHome from "./DatasourceHome";
import { getCurrentApplication } from "selectors/applicationSelectors";
import DataSourceEditorForm from "./DBForm";
import { Datasource } from "api/DatasourcesApi";
import { UserApplication } from "constants/userConstants";
import { RouteComponentProps } from "react-router";

interface ReduxStateProps {
  formData: Datasource;
  selectedPluginPackage: string;
  currentPluginId: string;
  isSaving: boolean;
  currentApplication: UserApplication;
  isTesting: boolean;
}

type Props = ReduxStateProps &
  DatasourcePaneFunctions &
  RouteComponentProps<{
    datasourceId: string;
    applicationId: string;
    pageId: string;
  }>;

class DataSourceEditor extends React.Component<Props> {
  handleSubmit = () => {
    this.props.submitForm(DATASOURCE_DB_FORM);
  };

  handleSave = (formData: Datasource) => {
    this.props.updateDatasource(formData);
  };

  render() {
    const {
      match: {
        params: { datasourceId },
      },
      selectedPluginPackage,
      isSaving,
      formData,
      isTesting,
    } = this.props;

    return (
      <React.Fragment>
        {datasourceId ? (
          <DataSourceEditorForm
            applicationId={this.props.match.params.applicationId}
            pageId={this.props.match.params.pageId}
            isSaving={isSaving}
            isTesting={isTesting}
            onSubmit={this.handleSubmit}
            onSave={this.handleSave}
            onTest={this.props.testDatasource}
            selectedPluginPackage={selectedPluginPackage}
            datasourceId={datasourceId}
            formData={formData}
          />
        ) : (
          <DatasourceHome
            isSaving={isSaving}
            applicationId={this.props.match.params.applicationId}
            pageId={this.props.match.params.pageId}
            history={this.props.history}
            location={this.props.location}
          />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  const { datasourcePane } = state.ui;
  const { datasources } = state.entities;
  const formData = getFormValues(DATASOURCE_DB_FORM)(state) as Datasource;

  return {
    formData,
    selectedPluginPackage: getPluginPackageFromId(
      state,
      datasourcePane.selectedPlugin,
    ),
    isSaving: datasources.loading,
    currentPluginId: datasourcePane.selectedPlugin,
    currentApplication: getCurrentApplication(state),
    isTesting: datasources.isTesting,
  };
};

const mapDispatchToProps = (dispatch: any): DatasourcePaneFunctions => ({
  submitForm: (name: string) => dispatch(submit(name)),
  updateDatasource: (formData: any) => {
    dispatch(updateDatasource(formData));
  },
  testDatasource: (data: Datasource) => dispatch(testDatasource(data)),
});

export interface DatasourcePaneFunctions {
  submitForm: (name: string) => void;
  updateDatasource: (data: Datasource) => void;
  testDatasource: (data: Datasource) => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(DataSourceEditor);
