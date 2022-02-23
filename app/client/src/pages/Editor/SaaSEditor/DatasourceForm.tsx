import React from "react";
import styled from "styled-components";
import _, { merge } from "lodash";
import { DATASOURCE_SAAS_FORM } from "constants/forms";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "./constants";
import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import AdsButton, { Category } from "components/ads/Button";
import { Datasource } from "entities/Datasource";
import { getFormValues, InjectedFormProps, reduxForm } from "redux-form";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getDatasource,
  getPlugin,
  getPluginImages,
} from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
} from "../DataSourceEditor/JSONtoForm";
import { getConfigInitialValues } from "components/formControls/utils";
import Connected from "../DataSourceEditor/Connected";
import { Colors } from "constants/Colors";

import { getCurrentApplicationId } from "selectors/editorSelectors";
import DatasourceAuth from "../../common/datasourceAuth";
import EntityNotFoundPane from "../EntityNotFoundPane";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { DatasourceComponentTypes } from "api/PluginApi";
import { createTempDatasourceFromForm } from "actions/datasourceActions";

interface StateProps extends JSONtoFormProps {
  applicationId: string;
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
  pluginId: string;
  actions: ActionDataState;
  datasource?: Datasource;
  pluginType: string;
  pluginDatasourceForm: string;
  formValues: any;
  createTempDatasourceFromForm: (data: any) => void;
  datasourceName: string;
}

type DatasourceSaaSEditorProps = StateProps &
  RouteComponentProps<{
    datasourceId: string;
    pageId: string;
    pluginPackageName: string;
  }>;

type Props = DatasourceSaaSEditorProps &
  InjectedFormProps<Datasource, DatasourceSaaSEditorProps>;

const EditDatasourceButton = styled(AdsButton)`
  padding: 10px 20px;
  &&&& {
    height: 32px;
    max-width: 160px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
`;

class DatasourceSaaSEditor extends JSONtoForm<Props> {
  componentDidMount() {
    // Create Temp Datasource on component mount
    if (this.props.match.params.datasourceId === TEMP_DATASOURCE_ID) {
      const urlObject = new URL(window.location.href);
      const pluginId = urlObject?.searchParams.get("pluginId");
      this.props.createTempDatasourceFromForm({
        pluginId,
        type: this.props.pluginType,
      });
    }
  }
  render() {
    const pluginIdFromParams = new URL(window.location.href).searchParams.get(
      "pluginId",
    );
    const { formConfig, pluginId } = this.props;
    if (!pluginId || !pluginIdFromParams) {
      return <EntityNotFoundPane />;
    }
    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }

  getSanitizedData = () => {
    return this.getTrimmedData({
      ...this.normalizeValues(),
      name: this.props.datasourceName,
    });
  };

  renderDataSourceConfigForm = (sections: any) => {
    const {
      applicationId,
      datasource,
      formData,
      match: {
        params: { datasourceId, pageId, pluginPackageName },
      },
    } = this.props;
    const params: string = location.search;
    const viewMode = new URLSearchParams(params).get("viewMode");
    const showConnectedComponent =
      viewMode && datasourceId !== TEMP_DATASOURCE_ID;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Header>
          <FormTitleContainer>
            <PluginImage alt="Datasource" src={this.props.pluginImage} />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>

          {showConnectedComponent && (
            <EditDatasourceButton
              category={Category.tertiary}
              className="t--edit-datasource"
              onClick={() => {
                this.props.history.replace(
                  SAAS_EDITOR_DATASOURCE_ID_URL(
                    applicationId,
                    pageId,
                    pluginPackageName,
                    datasourceId,
                    {
                      viewMode: false,
                    },
                  ),
                );
              }}
              text="EDIT"
            />
          )}
        </Header>
        {!viewMode && datasourceId === TEMP_DATASOURCE_ID && (
          <>
            {!_.isNil(sections)
              ? _.map(sections, this.renderMainSection)
              : null}
            {""}
          </>
        )}
        {showConnectedComponent && <Connected />}

        {/* Render datasource form call-to-actions */}
        {datasource && (
          <DatasourceAuth
            datasource={datasource}
            formData={formData}
            getSanitizedFormData={_.memoize(this.getSanitizedData)}
            isInvalid={this.validate()}
            shouldRender={!viewMode}
          />
        )}
      </form>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, props.match.params.datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_SAAS_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const formConfig = formConfigs[pluginId];
  const plugin = getPlugin(state, pluginId);

  const initialValues = {};
  if (formConfig) {
    merge(initialValues, getConfigInitialValues(formConfig));
  }
  merge(initialValues, datasource);

  return {
    datasource,
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    formData: formData,
    formConfig,
    isNewDatasource:
      datasourcePane.newDatasource === props.match.params.datasourceId ||
      props.match.params.datasourceId === TEMP_DATASOURCE_ID,
    pluginImage: getPluginImages(state)[pluginId],
    initialValues,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
    pluginDatasourceForm:
      plugin?.datasourceComponent ?? DatasourceComponentTypes.AutoForm,
    applicationId: getCurrentApplicationId(state),
    formValues: state.form,
    datasourceName:
      state.ui.datasourceName.name[props.match.params.datasourceId],
  };
};

const mapDispatchToProps = {
  createTempDatasourceFromForm,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Datasource, DatasourceSaaSEditorProps>({
    form: DATASOURCE_SAAS_FORM,
    enableReinitialize: true,
  })(DatasourceSaaSEditor),
);
