import React from "react";
import styled from "styled-components";
import _, { merge } from "lodash";
import { DATASOURCE_SAAS_FORM } from "constants/forms";
import { SAAS_EDITOR_URL } from "./constants";
import history from "utils/history";
import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { getFormValues, InjectedFormProps, reduxForm } from "redux-form";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getDatasource, getPluginImages } from "selectors/entitiesSelector";
import { ReduxAction } from "constants/ReduxActionConstants";
import {
  deleteDatasource,
  getOAuthAccessToken,
  redirectAuthorizationCode,
  updateDatasource,
} from "actions/datasourceActions";
import { historyPush } from "actions/utilActions";
import { createNewApiName } from "utils/AppsmithUtils";
import { createActionRequest } from "actions/actionActions";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  ActionButton,
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
  SaveButtonContainer,
} from "../DataSourceEditor/JSONtoForm";
import { getConfigInitialValues } from "components/formControls/utils";
import {
  SAAS_AUTHORIZATION_APPSMITH_ERROR,
  SAAS_AUTHORIZATION_FAILED,
} from "constants/messages";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { PluginType } from "entities/Action";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  INTEGRATION_EDITOR_MODES,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
} from "constants/routes";

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
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => void;
  deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) => void;
  getOAuthAccessToken: (id: string) => void;
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
    const search = new URLSearchParams(this.props.location.search);
    const status = search.get("response_status");

    if (status) {
      const display_message = search.get("display_message");
      // Set default error message
      let message = SAAS_AUTHORIZATION_FAILED;
      const variant = Variant.danger;
      if (status !== "success") {
        if (status === "appsmith_error") {
          message = SAAS_AUTHORIZATION_APPSMITH_ERROR;
        }
        Toaster.show({ text: display_message || message, variant });
      } else {
        this.props.getOAuthAccessToken(this.props.match.params.datasourceId);
      }
      AnalyticsUtil.logEvent("GSHEET_AUTH_COMPLETE", {
        applicationId: _.get(this.props, "match.params.applicationId"),
        datasourceId: _.get(this.props, "match.params.datasourceId"),
        pageId: _.get(this.props, "match.params.pageId"),
      });
    }
  }

  save = (onSuccess?: ReduxAction<unknown>) => {
    const normalizedValues = this.normalizeValues();
    this.props.updateDatasource(normalizedValues, onSuccess);
  };

  createApiAction = () => {
    const {
      actions,
      formData,
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
    const {
      formConfig,
      match: {
        params: { applicationId, pageId },
      },
    } = this.props;
    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content, () => {
      history.push(
        INTEGRATION_EDITOR_URL(
          applicationId,
          pageId,
          INTEGRATION_TABS.NEW,
          INTEGRATION_EDITOR_MODES.AUTO,
        ),
      );
    });
  }

  renderDataSourceConfigForm = (sections: any) => {
    const {
      deleteDatasource,
      isDeleting,
      isSaving,
      match: {
        params: { applicationId, datasourceId, pageId, pluginPackageName },
      },
    } = this.props;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <br />
        <Header>
          <FormTitleContainer>
            <PluginImage alt="Datasource" src={this.props.pluginImage} />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          <CreateApiButton
            accent="primary"
            className="t--create-query"
            disabled={this.validate()}
            filled
            icon={"plus"}
            loading={isSaving}
            onClick={() => this.createApiAction()}
            text="New API"
          />
        </Header>

        {!_.isNil(sections)
          ? _.map(sections, this.renderMainSection)
          : undefined}
        <SaveButtonContainer>
          <ActionButton
            accent="error"
            className="t--delete-datasource"
            loading={isDeleting}
            onClick={() =>
              deleteDatasource(
                datasourceId,
                historyPush(
                  SAAS_EDITOR_URL(applicationId, pageId, pluginPackageName),
                ),
              )
            }
            text="Delete"
          />
          <StyledButton
            className="t--save-datasource"
            disabled={this.validate()}
            filled
            intent="primary"
            loading={isSaving}
            onClick={() => {
              AnalyticsUtil.logEvent("GSHEET_AUTH_INIT", {
                applicationId,
                datasourceId,
                pageId,
              });
              this.save(
                redirectAuthorizationCode(
                  pageId,
                  datasourceId,
                  PluginType.SAAS,
                ),
              );
            }}
            size="small"
            text="Continue"
          />
        </SaveButtonContainer>
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
  const initialValues = {};
  if (formConfig) {
    merge(initialValues, getConfigInitialValues(formConfig));
  }
  merge(initialValues, datasource);
  return {
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    formData: formData,
    formConfig,
    isNewDatasource:
      datasourcePane.newDatasource === props.match.params.datasourceId,
    pluginImage: getPluginImages(state)[pluginId],
    initialValues,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
  };
};

const mapDispatchToProps = (dispatch: any): DispatchFunctions => {
  return {
    deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) =>
      dispatch(deleteDatasource({ id }, onSuccess)),
    updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) =>
      dispatch(updateDatasource(formData, onSuccess)),
    getOAuthAccessToken: (datasourceId: string) =>
      dispatch(getOAuthAccessToken(datasourceId)),
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
