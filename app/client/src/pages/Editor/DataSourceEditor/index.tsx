import React from "react";
import { connect } from "react-redux";
import { getFormValues, submit } from "redux-form";
import { AppState } from "reducers";
import _ from "lodash";
import {
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
import RestAPIDatasourceForm from "./RestAPIDatasourceForm";
import { Datasource } from "entities/Datasource";
import { RouteComponentProps } from "react-router";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { ReduxAction } from "constants/ReduxActionConstants";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "../SaaSEditor/constants";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";

interface ReduxStateProps {
  formData: Datasource;
  isSaving: boolean;
  isTesting: boolean;
  formConfig: any[];
  isDeleting: boolean;
  isNewDatasource: boolean;
  pluginImages: Record<string, string>;
  pluginId: string;
  viewMode: boolean;
  pluginType: string;
  pluginDatasourceForm: string;
  pluginPackageName: string;
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
      isSaving,
      formData,
      isTesting,
      formConfig,
      isDeleting,
      deleteDatasource,
      isNewDatasource,
      pluginImages,
      pluginId,
      viewMode,
      setDatasourceEditorMode,
      pluginType,
      openOmnibarReadMore,
    } = this.props;

    return (
      <DataSourceEditorForm
        pluginImage={pluginImages[pluginId]}
        applicationId={this.props.match.params.applicationId}
        pageId={this.props.match.params.pageId}
        isSaving={isSaving}
        isTesting={isTesting}
        isDeleting={isDeleting}
        isNewDatasource={isNewDatasource}
        onSubmit={this.handleSubmit}
        onSave={this.handleSave}
        onTest={this.props.testDatasource}
        datasourceId={datasourceId}
        formData={formData}
        formConfig={formConfig}
        handleDelete={deleteDatasource}
        viewMode={viewMode}
        setDatasourceEditorMode={setDatasourceEditorMode}
        openOmnibarReadMore={openOmnibarReadMore}
        pluginType={pluginType}
        formName={DATASOURCE_DB_FORM}
      />
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, props.match.params.datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_DB_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  return {
    pluginImages: getPluginImages(state),
    formData,
    pluginId,
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    isTesting: datasources.isTesting,
    formConfig: formConfigs[pluginId] || [],
    isNewDatasource:
      datasourcePane.newDatasource === props.match.params.datasourceId,
    viewMode: datasourcePane.viewMode[datasource?.id ?? ""] ?? true,
    pluginType: plugin?.type ?? "",
    pluginDatasourceForm: plugin?.datasourceComponent ?? "AutoForm",
    pluginPackageName: plugin?.packageName ?? "",
  };
};

const mapDispatchToProps = (dispatch: any): DatasourcePaneFunctions => ({
  submitForm: (name: string) => dispatch(submit(name)),
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => {
    dispatch(updateDatasource(formData, onSuccess));
  },
  testDatasource: (data: Datasource) => dispatch(testDatasource(data)),
  deleteDatasource: (id: string) => dispatch(deleteDatasource({ id })),
  switchDatasource: (id: string) => dispatch(switchDatasource(id)),
  setDatasourceEditorMode: (id: string, viewMode: boolean) =>
    dispatch(setDatsourceEditorMode({ id, viewMode })),
  openOmnibarReadMore: (text: string) => {
    dispatch(setGlobalSearchQuery(text));
    dispatch(toggleShowGlobalSearchModal());
  },
});

export interface DatasourcePaneFunctions {
  submitForm: (name: string) => void;
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => void;
  testDatasource: (data: Datasource) => void;
  deleteDatasource: (id: string) => void;
  switchDatasource: (id: string) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
  openOmnibarReadMore: (text: string) => void;
}

class DatasourceEditorRouter extends React.Component<Props> {
  render() {
    const {
      match: {
        params: { datasourceId, applicationId, pageId },
      },
      isSaving,
      history,
      isDeleting,
      location,
      isNewDatasource,
      pluginImages,
      pluginId,
      pluginDatasourceForm,
      pluginPackageName,
    } = this.props;
    if (!pluginId && datasourceId) {
      return <EntityNotFoundPane />;
    }
    if (!datasourceId) {
      return (
        <DatasourceHome
          isSaving={isSaving}
          applicationId={applicationId}
          pageId={pageId}
          history={history}
          location={location}
        />
      );
    }

    // Check for specific form types first
    if (pluginDatasourceForm === "RestAPIDatasourceForm") {
      return (
        <RestAPIDatasourceForm
          pluginImage={pluginImages[pluginId]}
          applicationId={this.props.match.params.applicationId}
          datasourceId={datasourceId}
          pageId={this.props.match.params.pageId}
          isSaving={isSaving}
          isDeleting={isDeleting}
          isNewDatasource={isNewDatasource}
          location={location}
        />
      );
    }
    if (pluginDatasourceForm === "SaaSDatasourceForm") {
      history.push(
        SAAS_EDITOR_DATASOURCE_ID_URL(
          applicationId,
          pageId,
          pluginPackageName,
          datasourceId,
        ),
      );
      return;
    }

    // Default to old flow
    // Todo: later refactor to make this "AutoForm"
    return <DataSourceEditor {...this.props} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceEditorRouter);
