import React from "react";
import { connect } from "react-redux";
import { getFormValues } from "redux-form";
import { AppState } from "reducers";
import _ from "lodash";
import {
  getPluginImages,
  getDatasource,
  getPlugin,
} from "selectors/entitiesSelector";
import {
  switchDatasource,
  setDatsourceEditorMode,
} from "actions/datasourceActions";
import { DATASOURCE_DB_FORM } from "constants/forms";
import DataSourceEditorForm from "./DBForm";
import RestAPIDatasourceForm from "./RestAPIDatasourceForm";
import { Datasource } from "entities/Datasource";
import { RouteComponentProps } from "react-router";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { DatasourceComponentTypes } from "api/PluginApi";
import DatasourceSaasForm from "../SaaSEditor/DatasourceForm";

import {
  getCurrentApplicationId,
  selectURLSlugs,
} from "selectors/editorSelectors";
import { saasEditorDatasourceIdURL } from "RouteBuilder";
import {
  createMessage,
  REST_API_AUTHORIZATION_APPSMITH_ERROR,
  REST_API_AUTHORIZATION_FAILED,
  REST_API_AUTHORIZATION_SUCCESSFUL,
} from "ce/constants/messages";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

interface ReduxStateProps {
  datasourceId: string;
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
  applicationSlug: string;
  pageSlug: string;
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

    if (
      this.props.pluginDatasourceForm === "RestAPIDatasourceForm" &&
      this.props.location
    ) {
      const search = new URLSearchParams(this.props.location.search);
      const responseStatus = search.get("response_status");
      const responseMessage = search.get("display_message");
      if (responseStatus) {
        // Set default error message
        let message = REST_API_AUTHORIZATION_FAILED;
        let variant = Variant.danger;
        if (responseStatus === "success") {
          message = REST_API_AUTHORIZATION_SUCCESSFUL;
          variant = Variant.success;
        } else if (responseStatus === "appsmith_error") {
          message = REST_API_AUTHORIZATION_APPSMITH_ERROR;
        }
        Toaster.show({
          text: responseMessage || createMessage(message),
          variant,
        });
      }
    }
  }

  render() {
    const {
      datasourceId,
      formConfig,
      formData,
      fromImporting,
      isDeleting,
      isNewDatasource,
      isSaving,
      isTesting,
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
        hiddenHeader={fromImporting}
        isDeleting={isDeleting}
        isNewDatasource={isNewDatasource}
        isSaving={isSaving}
        isTesting={isTesting}
        openOmnibarReadMore={openOmnibarReadMore}
        pageId={pageId}
        pluginImage={pluginImages[pluginId]}
        pluginType={pluginType}
        setDatasourceEditorMode={setDatasourceEditorMode}
        viewMode={viewMode && !fromImporting}
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
  const { applicationSlug, pageSlug } = selectURLSlugs(state);

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
    applicationSlug,
    pageSlug,
  };
};

const mapDispatchToProps = (
  dispatch: any,
  ownProps: any,
): DatasourcePaneFunctions => ({
  switchDatasource: (id: string) => {
    // on reconnect data modal, it shouldn't be redirected to datasource edit page
    dispatch(switchDatasource(id, ownProps.fromImporting));
  },
  setDatasourceEditorMode: (id: string, viewMode: boolean) =>
    dispatch(setDatsourceEditorMode({ id, viewMode })),
  openOmnibarReadMore: (text: string) => {
    dispatch(setGlobalSearchQuery(text));
    dispatch(toggleShowGlobalSearchModal());
  },
});

export interface DatasourcePaneFunctions {
  switchDatasource: (id: string) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
  openOmnibarReadMore: (text: string) => void;
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

    const shouldViewMode = viewMode && !fromImporting;
    // Check for specific form types first
    if (pluginDatasourceForm === "RestAPIDatasourceForm" && !shouldViewMode) {
      return (
        <RestAPIDatasourceForm
          applicationId={this.props.applicationId}
          datasourceId={datasourceId}
          hiddenHeader={fromImporting}
          isDeleting={isDeleting}
          isNewDatasource={isNewDatasource}
          isSaving={isSaving}
          location={location}
          pageId={pageId}
          pluginImage={pluginImages[pluginId]}
        />
      );
    }
    // for saas form
    if (pluginType === "SAAS") {
      // todo check if we can remove the flag here
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
        saasEditorDatasourceIdURL({
          pageId,
          pluginPackageName,
          datasourceId,
        }),
      );
      return null;
    }

    // Default to old flow
    // Todo: later refactor to make this "AutoForm"
    return (
      <DataSourceEditor
        {...this.props}
        datasourceId={datasourceId}
        pageId={pageId}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceEditorRouter);
