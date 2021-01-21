import React from "react";
import { connect } from "react-redux";
import { getFormValues, submit } from "redux-form";
import { AppState } from "reducers";
import _ from "lodash";
import {
  getPluginPackageFromId,
  getPluginImages,
  getDatasource,
  getPlugin,
} from "selectors/entitiesSelector";
import {
  updateDatasource,
  testDatasource,
  deleteDatasource,
  switchDatasource,
  setDatsourceEditorMode,
} from "actions/datasourceActions";
import { DATASOURCE_DB_FORM } from "constants/forms";
import DatasourceHome from "./DatasourceHome";
import DataSourceEditorForm from "./DBForm";
import { Datasource } from "entities/Datasource";
import { RouteComponentProps } from "react-router";

interface ReduxStateProps {
  formData: Datasource;
  selectedPluginPackage: string;
  isSaving: boolean;
  isTesting: boolean;
  formConfig: any[];
  loadingFormConfigs: boolean;
  isDeleting: boolean;
  newDatasource: string;
  pluginImages: Record<string, string>;
  pluginId: string;
  viewMode: boolean;
  pluginType: string;
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
      pluginImages,
      pluginId,
      viewMode,
      setDatasourceEditorMode,
      pluginType,
    } = this.props;

    return (
      <React.Fragment>
        {datasourceId ? (
          <DataSourceEditorForm
            pluginImage={pluginImages[pluginId]}
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
            viewMode={viewMode}
            setDatasourceEditorMode={setDatasourceEditorMode}
            pluginType={pluginType}
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

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, props.match.params.datasourceId);
  const { formConfigs, loadingFormConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_DB_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  return {
    pluginImages: getPluginImages(state),
    formData,
    pluginId,
    selectedPluginPackage: getPluginPackageFromId(
      state,
      datasourcePane.selectedPlugin,
    ),
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    isTesting: datasources.isTesting,
    formConfig: formConfigs[pluginId] || [],
    loadingFormConfigs,
    newDatasource: datasourcePane.newDatasource,
    viewMode: datasourcePane.viewMode[datasource?.id ?? ""] ?? true,
    pluginType: plugin?.type ?? "",
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
  setDatasourceEditorMode: (id: string, viewMode: boolean) =>
    dispatch(setDatsourceEditorMode({ id, viewMode })),
});

export interface DatasourcePaneFunctions {
  submitForm: (name: string) => void;
  updateDatasource: (data: Datasource) => void;
  testDatasource: (data: Datasource) => void;
  deleteDatasource: (id: string) => void;
  switchDatasource: (id: string) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(DataSourceEditor);
