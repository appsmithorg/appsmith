import React from "react";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_SAAS_FORM } from "constants/forms";
import { SAAS_EDITOR_URL } from "./constants";
import history from "utils/history";
import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps, getFormValues } from "redux-form";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import BackButton from "pages/Editor/DataSourceEditor/BackButton";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getDatasource, getPluginImages } from "selectors/entitiesSelector";
import { ReduxAction } from "constants/ReduxActionConstants";
import {
  deleteDatasource,
  redirectAuthorizationCode,
  updateDatasource,
} from "actions/datasourceActions";
import { fetchPluginForm } from "actions/pluginActions";
import { historyPush } from "actions/utilActions";
import { createNewApiName } from "utils/AppsmithUtils";
import { createActionRequest } from "actions/actionActions";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  SAAS_AUTHORIZATION_APPSMITH_ERROR,
  SAAS_AUTHORIZATION_FAILED,
  SAAS_AUTHORIZATION_SUCCESSFUL,
} from "constants/messages";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  ActionButton,
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
  SaveButtonContainer,
} from "../DataSourceEditor/JSONtoForm";

interface StateProps extends JSONtoFormProps {
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
  pluginId: string;
  actions: ActionDataState;
}

interface DispatchFunctions {
  fetchPluginForm: (id: string) => void;
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => void;
  deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) => void;
}

type DatasourceSaaSEditorProps = StateProps &
  DispatchFunctions &
  RouteComponentProps<{
    datasourceId: string;
    applicationId: string;
    pageId: string;
    pluginPackageName: string;
  }>;

type Props = DatasourceSaaSEditorProps &
  InjectedFormProps<Datasource, DatasourceSaaSEditorProps>;

const StyledButton = styled(Button)`
  &&&& {
    width: 180px;
    height: 32px;
  }
`;

const CreateApiButton = styled(BaseButton)`
  &&& {
    max-width: 120px;
    margin-right: 9px;
    align-self: center;
    min-height: 32px;
  }
`;

class DatasourceSaaSEditor extends JSONtoForm<Props> {
  componentDidMount() {
    super.componentDidMount();
    if (this.props.pluginId) {
      this.props.fetchPluginForm(this.props.pluginId);
    }
    const search = new URLSearchParams(this.props.location.search);
    const status = search.get("response_status");

    if (status) {
      const display_message = search.get("display_message");
      // Set default error message
      let message = SAAS_AUTHORIZATION_FAILED;
      let variant = Variant.danger;
      if (status === "success") {
        message = SAAS_AUTHORIZATION_SUCCESSFUL;
        variant = Variant.success;
      } else if (status === "appsmith_error") {
        message = SAAS_AUTHORIZATION_APPSMITH_ERROR;
      }
      Toaster.show({ text: display_message || message, variant });
    }
  }

  componentDidUpdate(prevProps: Props) {
    super.componentDidUpdate(prevProps);
    if (this.props.pluginId && prevProps.pluginId !== this.props.pluginId) {
      this.props.fetchPluginForm(this.props.pluginId);
    }
  }

  save = (onSuccess?: ReduxAction<unknown>) => {
    const normalizedValues = this.normalizeValues();
    this.props.updateDatasource(normalizedValues, onSuccess);
  };

  createApiAction = () => {
    const {
      formData,
      actions,
      match: {
        params: { pageId },
      },
    } = this.props;
    const newApiName = createNewApiName(actions, pageId || "");

    this.save(
      createActionRequest({
        name: newApiName,
        pageId: pageId,
        pluginId: formData.pluginId,
        datasource: {
          id: formData.id,
        },
      }),
    );
  };

  render() {
    const { formConfig, loadingFormConfigs } = this.props;
    if (loadingFormConfigs) {
      return this.renderLoader();
    }
    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }

  renderDataSourceConfigForm = (sections: any) => {
    const {
      match: {
        params: { applicationId, datasourceId, pageId, pluginPackageName },
      },
      isSaving,
      isDeleting,
      deleteDatasource,
    } = this.props;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <BackButton
          onClick={() =>
            history.push(
              SAAS_EDITOR_URL(applicationId, pageId, pluginPackageName),
            )
          }
        />
        <br />
        <Header>
          <FormTitleContainer>
            <PluginImage src={this.props.pluginImage} alt="Datasource" />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          <CreateApiButton
            className="t--create-query"
            icon={"plus"}
            text="New API"
            filled
            accent="primary"
            disabled={this.validate()}
            loading={isSaving}
            onClick={() => this.createApiAction()}
          />
        </Header>

        <>
          {!_.isNil(sections)
            ? _.map(sections, this.renderMainSection)
            : undefined}
          <SaveButtonContainer>
            <ActionButton
              className="t--delete-datasource"
              text="Delete"
              accent="error"
              loading={isDeleting}
              onClick={() =>
                deleteDatasource(
                  datasourceId,
                  historyPush(
                    SAAS_EDITOR_URL(applicationId, pageId, pluginPackageName),
                  ),
                )
              }
            />

            <StyledButton
              className="t--save-datasource"
              onClick={() =>
                this.save(redirectAuthorizationCode(pageId, datasourceId))
              }
              text="Save and Authorize"
              disabled={this.validate()}
              loading={isSaving}
              intent="primary"
              filled
              size="small"
            />
          </SaveButtonContainer>
        </>
      </form>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, props.match.params.datasourceId);
  const { formConfigs, loadingFormConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_SAAS_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  return {
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    loadingFormConfigs: loadingFormConfigs,
    formData: formData,
    formConfig: formConfigs[pluginId],
    isNewDatasource:
      datasourcePane.newDatasource === props.match.params.datasourceId,
    pluginImage: getPluginImages(state)[pluginId],
    initialValues: datasource,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
  };
};

const mapDispatchToProps = (dispatch: any): DispatchFunctions => {
  return {
    deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) =>
      dispatch(deleteDatasource({ id }, onSuccess)),
    fetchPluginForm: (id: string) => dispatch(fetchPluginForm({ id })),
    updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) =>
      dispatch(updateDatasource(formData, onSuccess)),
  };
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
