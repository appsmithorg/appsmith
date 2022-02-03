import React from "react";
import { connect } from "react-redux";
import { getFormValues, submit } from "redux-form";
import { AppState } from "reducers";
import _, { noop } from "lodash";
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
import DataSourceEditorForm from "./DBForm";
import RestAPIDatasourceForm from "./RestAPIDatasourceForm";
import { Datasource } from "entities/Datasource";
import { RouteComponentProps } from "react-router";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { ReduxAction } from "constants/ReduxActionConstants";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "../SaaSEditor/constants";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import { redirectToNewIntegrations } from "actions/apiPaneActions";
import { DatasourceComponentTypes } from "api/PluginApi";
import DatasourceSaasForm from "../SaaSEditor/DatasourceForm";

import { getCurrentApplicationId } from "selectors/editorSelectors";

interface ReduxStateProps {
  datasourceId: string | null;
  formData: Datasource;
  isSaving: boolean;
  isTesting: boolean;
  formConfig: any[];
  isDeleting: boolean;
  isNewDatasource: boolean;
  pageId: string;
  pluginImages: Record<string, string>;
  pluginId: string;
  viewMode: boolean;
  pluginType: string;
  pluginDatasourceForm: string;
  pluginPackageName: string;
  applicationId: string;
  fromImporting?: boolean;
}

type Props = ReduxStateProps &
  DatasourcePaneFunctions &
  RouteComponentProps<{
    datasourceId: string;
    pageId: string;
  }>;

class DataSourceEditor extends React.Component<Props> {
  componentDidUpdate(prevProps: Props) {
    //Fix to prevent restapi datasource from being set in DatasourceDBForm in view mode
    //TODO: Needs cleanup
    if (
      this.props.pluginDatasourceForm !== "RestAPIDatasourceForm" &&
      this.props.datasourceId &&
      this.props.datasourceId !== prevProps.datasourceId
    ) {
      this.props.switchDatasource(this.props.datasourceId);
    }
  }
  componentDidMount() {
    //Fix to prevent restapi datasource from being set in DatasourceDBForm in datasource view mode
    //TODO: Needs cleanup
    if (
      this.props.datasourceId &&
      this.props.pluginDatasourceForm !== "RestAPIDatasourceForm"
    ) {
      this.props.switchDatasource(this.props.datasourceId);
    }
  }
  handleSubmit = () => {
    this.props.submitForm(DATASOURCE_DB_FORM);
  };

  handleSave = (formData: Datasource) => {
    const { pageId } = this.props.match.params;
    this.props.updateDatasource(
      formData,
      this.props.redirectToNewIntegrations(
        this.props.applicationId,
        pageId,
        getQueryParams(),
      ),
    );
  };

  render() {
    const {
      datasourceId,
      deleteDatasource,
      formConfig,
      formData,
      fromImporting,
      isDeleting,
      isNewDatasource,
      isSaving,
      isTesting,
      // match: {
      //   params: { datasourceId },
      // },
      openOmnibarReadMore,
      pageId,
      pluginId,
      pluginImages,
      pluginType,
      setDatasourceEditorMode,
      viewMode,
    } = this.props;

    return (
      <DataSourceEditorForm
        applicationId={this.props.applicationId}
        datasourceId={datasourceId}
        formConfig={formConfig}
        formData={formData}
        formName={DATASOURCE_DB_FORM}
        handleDelete={deleteDatasource}
        hiddenHeader={fromImporting}
        isDeleting={isDeleting}
        isNewDatasource={isNewDatasource}
        isSaving={isSaving}
        isTesting={isTesting}
        onSave={this.handleSave}
        onSubmit={this.handleSubmit}
        onTest={this.props.testDatasource}
        openOmnibarReadMore={openOmnibarReadMore}
        pageId={pageId}
        pluginImage={pluginImages[pluginId]}
        pluginType={pluginType}
        setDatasourceEditorMode={setDatasourceEditorMode}
        viewMode={viewMode}
      />
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const datasourceId = props.datasourceId ?? props.match?.params?.datasourceId;
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_DB_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  return {
    datasourceId,
    pluginImages: getPluginImages(state),
    formData,
    fromImporting: props.fromImporting ?? false,
    pluginId,
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    isTesting: datasources.isTesting,
    formConfig: formConfigs[pluginId] || [],
    isNewDatasource: datasourcePane.newDatasource === datasourceId,
    pageId: props.pageId ?? props.match?.params?.pageId,
    viewMode:
      datasourcePane.viewMode[datasource?.id ?? ""] ?? !props.fromImporting,
    pluginType: plugin?.type ?? "",
    pluginDatasourceForm:
      plugin?.datasourceComponent ?? DatasourceComponentTypes.AutoForm,
    pluginPackageName: plugin?.packageName ?? "",
    applicationId: props.applicationId ?? getCurrentApplicationId(state),
  };
};

const mapDispatchToProps = (
  dispatch: any,
  ownProps: any,
): DatasourcePaneFunctions => ({
  submitForm: (name: string) => dispatch(submit(name)),
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => {
    dispatch(updateDatasource(formData, onSuccess));
  },
  redirectToNewIntegrations: ownProps.fromImporting
    ? noop
    : (applicationId: string, pageId: string, params: any) => {
        dispatch(redirectToNewIntegrations(applicationId, pageId, params));
      },
  testDatasource: (data: Datasource) => dispatch(testDatasource(data)),
  deleteDatasource: ownProps.fromImporting
    ? noop
    : (id: string) => dispatch(deleteDatasource({ id })),
  switchDatasource: ownProps.fromImporting
    ? noop
    : (id: string) => dispatch(switchDatasource(id)),
  setDatasourceEditorMode: ownProps.fromImporting
    ? noop
    : (id: string, viewMode: boolean) =>
        dispatch(setDatsourceEditorMode({ id, viewMode })),
  openOmnibarReadMore: ownProps.fromImporting
    ? noop
    : (text: string) => {
        dispatch(setGlobalSearchQuery(text));
        dispatch(toggleShowGlobalSearchModal());
      },
});

export interface DatasourcePaneFunctions {
  submitForm: (name: string) => void;
  updateDatasource: (formData: any, onSuccess?: any) => void;
  testDatasource: (data: Datasource) => void;
  deleteDatasource: (id: string) => void;
  switchDatasource: (id: string) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
  openOmnibarReadMore: (text: string) => void;
  redirectToNewIntegrations: (
    applicationId: string,
    pageId: string,
    params: any,
  ) => void;
}

class DatasourceEditorRouter extends React.Component<Props> {
  render() {
    const {
      datasourceId,
      fromImporting,
      history,
      isDeleting,
      isNewDatasource,
      isSaving,
      location,
      // match: {
      //   params: { datasourceId, pageId },
      // },
      pageId,
      pluginDatasourceForm,
      pluginId,
      pluginImages,
      pluginPackageName,
      pluginType,
      viewMode,
    } = this.props;
    if (!pluginId && datasourceId) {
      return <EntityNotFoundPane />;
    }

    // Check for specific form types first
    if (pluginDatasourceForm === "RestAPIDatasourceForm" && !viewMode) {
      return (
        <RestAPIDatasourceForm
          applicationId={this.props.applicationId}
          datasourceId={datasourceId}
          isDeleting={isDeleting}
          isNewDatasource={isNewDatasource}
          isSaving={isSaving}
          location={location}
          pageId={this.props.match.params.pageId}
          pluginImage={pluginImages[pluginId]}
        />
      );
    }
    // for saas form
    if (pluginType === "SAAS") {
      if (fromImporting) {
        return (
          <DatasourceSaasForm
            datasourceId={datasourceId}
            hiddenHeader
            pageId={pageId}
            pluginPackageName={pluginPackageName}
          />
        );
      }
      history.push(
        SAAS_EDITOR_DATASOURCE_ID_URL(
          this.props.applicationId,
          pageId,
          pluginPackageName,
          datasourceId ?? undefined,
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
