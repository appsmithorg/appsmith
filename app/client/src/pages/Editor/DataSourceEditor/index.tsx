import React from "react";
import { connect } from "react-redux";
import { getFormValues, submit } from "redux-form";
import { AppState } from "reducers";
import { getPluginPackageFromId } from "selectors/entitiesSelector";
import {
  updateDatasource,
  testDatasource,
  deleteDatasource,
  switchDatasource,
} from "actions/datasourceActions";
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
  formConfig: [];
  loadingFormConfigs: boolean;
  isDeleting: boolean;
  newDatasource: string;
}

type Props = ReduxStateProps &
  DatasourcePaneFunctions &
  RouteComponentProps<{
    datasourceId: string;
    applicationId: string;
    pageId: string;
  }>;

class DataSourceEditor extends React.Component<Props> {
  componentDidUpdate(prevProps: Props) {
    if (
      this.props.match.params.datasourceId &&
      this.props.match.params.datasourceId !==
        prevProps.match.params.datasourceId
    ) {
      this.props.switchDatasource(this.props.match.params.datasourceId);
    }
  }
  componentDidMount() {
    if (this.props.match.params.datasourceId) {
      this.props.switchDatasource(this.props.match.params.datasourceId);
    }
  }
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
      loadingFormConfigs,
      formConfig,
      isDeleting,
      deleteDatasource,
      newDatasource,
    } = this.props;

    return (
      <React.Fragment>
        {datasourceId ? (
          <DataSourceEditorForm
            applicationId={this.props.match.params.applicationId}
            pageId={this.props.match.params.pageId}
            isSaving={isSaving}
            isTesting={isTesting}
            isDeleting={isDeleting}
            isNewDatasource={newDatasource === datasourceId}
            onSubmit={this.handleSubmit}
            onSave={this.handleSave}
            onTest={this.props.testDatasource}
            selectedPluginPackage={selectedPluginPackage}
            datasourceId={datasourceId}
            formData={formData}
            loadingFormConfigs={loadingFormConfigs}
            formConfig={formConfig}
            handleDelete={deleteDatasource}
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
  const { datasources, plugins } = state.entities;
  const { formConfigs, loadingFormConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_DB_FORM)(state) as Datasource;

  return {
    formData,
    selectedPluginPackage: getPluginPackageFromId(
      state,
      datasourcePane.selectedPlugin,
    ),
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    currentPluginId: datasourcePane.selectedPlugin,
    currentApplication: getCurrentApplication(state),
    isTesting: datasources.isTesting,
    formConfig: formConfigs[datasourcePane.selectedPlugin] || [],
    loadingFormConfigs,
    newDatasource: datasourcePane.newDatasource,
  };
};

const mapDispatchToProps = (dispatch: any): DatasourcePaneFunctions => ({
  submitForm: (name: string) => dispatch(submit(name)),
  updateDatasource: (formData: any) => {
    dispatch(updateDatasource(formData));
  },
  testDatasource: (data: Datasource) => dispatch(testDatasource(data)),
  deleteDatasource: (id: string) => dispatch(deleteDatasource({ id })),
  switchDatasource: (id: string) => dispatch(switchDatasource(id)),
});

export interface DatasourcePaneFunctions {
  submitForm: (name: string) => void;
  updateDatasource: (data: Datasource) => void;
  testDatasource: (data: Datasource) => void;
  deleteDatasource: (id: string) => void;
  switchDatasource: (id: string) => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(DataSourceEditor);
