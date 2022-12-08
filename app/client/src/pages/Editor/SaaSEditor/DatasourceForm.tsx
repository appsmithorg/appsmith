import React from "react";
import _, { merge } from "lodash";
import { DATASOURCE_SAAS_FORM } from "@appsmith/constants/forms";
import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import { Category } from "design-system";
import { Datasource } from "entities/Datasource";
import { getFormValues, InjectedFormProps, reduxForm } from "redux-form";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getDatasource,
  getPluginImages,
  getDatasourceFormButtonConfig,
  getPlugin,
} from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  ActionWrapper,
  EditDatasourceButton,
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
} from "../DataSourceEditor/JSONtoForm";
import { getConfigInitialValues } from "components/formControls/utils";
import Connected from "../DataSourceEditor/Connected";

import { getCurrentApplicationId } from "selectors/editorSelectors";
import DatasourceAuth from "pages/common/datasourceAuth";
import EntityNotFoundPane from "../EntityNotFoundPane";
import { saasEditorDatasourceIdURL } from "RouteBuilder";
import NewActionButton from "../DataSourceEditor/NewActionButton";
import { Plugin } from "api/PluginApi";
import { isDatasourceAuthorizedForQueryCreation } from "utils/editorContextUtils";
import { PluginPackageName } from "entities/Action";
import AuthMessage from "pages/common/datasourceAuth/AuthMessage";

interface StateProps extends JSONtoFormProps {
  applicationId: string;
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
  plugin?: Plugin;
  pluginId: string;
  actions: ActionDataState;
  datasource?: Datasource;
  datasourceButtonConfiguration: string[] | undefined;
  hiddenHeader?: boolean; // for reconnect modal
  pageId?: string; // for reconnect modal
  pluginPackageName: string; // for reconnect modal
}

type DatasourceSaaSEditorProps = StateProps &
  RouteComponentProps<{
    datasourceId: string;
    pageId: string;
    pluginPackageName: string;
  }>;

type Props = DatasourceSaaSEditorProps &
  InjectedFormProps<Datasource, DatasourceSaaSEditorProps>;

class DatasourceSaaSEditor extends JSONtoForm<Props> {
  render() {
    const { formConfig, pluginId } = this.props;
    if (!pluginId) {
      return <EntityNotFoundPane />;
    }
    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }

  getSanitizedData = () => {
    return this.normalizeValues();
  };

  renderDataSourceConfigForm = (sections: any) => {
    const {
      datasource,
      datasourceButtonConfiguration,
      datasourceId,
      formData,
      hiddenHeader,
      pageId,
      plugin,
      pluginPackageName,
    } = this.props;

    const params: string = location.search;
    const viewMode =
      !hiddenHeader && new URLSearchParams(params).get("viewMode");

    /* 
      TODO: This flag will be removed once the multiple environment is merged to avoid design inconsistency between different datasources.
      Search for: GoogleSheetPluginFlag to check for all the google sheet conditional logic throughout the code.
    */
    const isGoogleSheetPlugin =
      plugin?.packageName === PluginPackageName.GOOGLE_SHEETS;

    const isPluginAuthorized =
      plugin && isDatasourceAuthorizedForQueryCreation(formData, plugin);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {!hiddenHeader && (
          <Header>
            <FormTitleContainer>
              <PluginImage alt="Datasource" src={this.props.pluginImage} />
              <FormTitle focusOnMount={this.props.isNewDatasource} />
            </FormTitleContainer>

            <ActionWrapper>
              {viewMode && (
                <>
                  <EditDatasourceButton
                    category={Category.tertiary}
                    className="t--edit-datasource"
                    onClick={() => {
                      this.props.history.replace(
                        saasEditorDatasourceIdURL({
                          pageId: pageId || "",
                          pluginPackageName,
                          datasourceId,
                          params: {
                            viewMode: false,
                          },
                        }),
                      );
                    }}
                    text="EDIT"
                  />
                  {isGoogleSheetPlugin && (
                    <NewActionButton
                      datasource={datasource}
                      disabled={!isPluginAuthorized}
                      eventFrom="datasource-pane"
                      plugin={plugin}
                      style={{
                        marginLeft: "16px",
                      }}
                    />
                  )}
                </>
              )}
            </ActionWrapper>
          </Header>
        )}
        {!viewMode ? (
          <>
            {!_.isNil(sections)
              ? _.map(sections, this.renderMainSection)
              : null}
            {""}
          </>
        ) : (
          <Connected
            errorComponent={
              datasource && isGoogleSheetPlugin && !isPluginAuthorized ? (
                <AuthMessage
                  actionType="authorize"
                  datasource={datasource}
                  pageId={pageId}
                />
              ) : null
            }
            showDatasourceSavedText={!isGoogleSheetPlugin}
          />
        )}
        {/* Render datasource form call-to-actions */}
        {datasource && (
          <DatasourceAuth
            datasource={datasource}
            datasourceButtonConfiguration={datasourceButtonConfiguration}
            formData={formData}
            getSanitizedFormData={_.memoize(this.getSanitizedData)}
            isInvalid={this.validate()}
            pageId={pageId}
            shouldDisplayAuthMessage={!isGoogleSheetPlugin}
            shouldRender={!viewMode}
          />
        )}
      </form>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasourceId = props.datasourceId || props.match?.params?.datasourceId;
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_SAAS_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  const formConfig = formConfigs[pluginId];
  const initialValues = {};
  if (formConfig) {
    merge(initialValues, getConfigInitialValues(formConfig));
  }
  merge(initialValues, datasource);

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    formData?.pluginId,
  );

  return {
    datasource,
    datasourceButtonConfiguration,
    datasourceId,
    isSaving: datasources.loading,
    isDeleting: !!datasource?.isDeleting,
    formData: formData,
    formConfig,
    isNewDatasource: datasourcePane.newDatasource === datasourceId,
    pageId: props.pageId || props.match?.params?.pageId,
    plugin: plugin,
    pluginImage: getPluginImages(state)[pluginId],
    pluginPackageName:
      props.pluginPackageName || props.match?.params?.pluginPackageName,
    initialValues,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
    applicationId: getCurrentApplicationId(state),
  };
};

export default connect(mapStateToProps)(
  reduxForm<Datasource, DatasourceSaaSEditorProps>({
    form: DATASOURCE_SAAS_FORM,
    enableReinitialize: true,
  })(DatasourceSaaSEditor),
);
