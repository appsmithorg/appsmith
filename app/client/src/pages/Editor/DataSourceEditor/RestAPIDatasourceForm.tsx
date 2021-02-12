import React from "react";
import styled from "styled-components";
import { createNewApiName } from "utils/AppsmithUtils";
import { DATASOURCE_REST_API_FORM } from "constants/forms";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import history from "utils/history";
import FormTitle from "./FormTitle";
import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps, getFormValues } from "redux-form";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import AnalyticsUtil from "utils/AnalyticsUtil";
import BackButton from "./BackButton";
import InputTextControl from "components/formControls/InputTextControl";
import KeyValueInputControl from "components/formControls/KeyValueInputControl";
import DropDownControl from "components/formControls/DropDownControl";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { ApiActionConfig } from "entities/Action";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import { createActionRequest } from "actions/actionActions";
import {
  deleteDatasource,
  redirectAuthorizationCode,
  updateDatasource,
} from "actions/datasourceActions";
import { ReduxAction } from "constants/ReduxActionConstants";
import {
  datasourceToFormValues,
  formValuesToDatasource,
} from "transformers/RestAPIDatasourceFormTransformer";
import {
  ApiDatasourceForm,
  AuthType,
  GrantType,
} from "entities/Datasource/RestAPIForm";
import {
  OAUTH_AUTHORIZATION_FAILED,
  OAUTH_AUTHORIZATION_SUCCESSFUL,
} from "constants/messages";
import Collapsible from "./Collapsible";
import _ from "lodash";

interface DatasourceRestApiEditorProps {
  updateDatasource: (
    formValues: Datasource,
    onSuccess?: ReduxAction<unknown>,
  ) => void;
  deleteDatasource: (id: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  applicationId: string;
  datasourceId: string;
  pageId: string;
  isNewDatasource: boolean;
  pluginImage: string;
  location: {
    search: string;
  };
  datasource: Datasource;
  formData: ApiDatasourceForm;
  actions: ActionDataState;
}

type Props = DatasourceRestApiEditorProps &
  InjectedFormProps<ApiDatasourceForm, DatasourceRestApiEditorProps>;

const RestApiForm = styled.div`
  padding: 20px;
  margin-left: 10px;
  margin-right: 0px;
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  overflow: auto;
  .backBtn {
    padding-bottom: 1px;
    cursor: pointer;
  }
  .backBtnText {
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
  }
`;

const FormInputContainer = styled.div`
  margin-top: 16px;
`;

export const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const PluginImage = styled.img`
  height: 40px;
  width: auto;
`;

export const FormTitleContainer = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
`;

export const Header = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;

const SaveButtonContainer = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    margin-right: 9px;
    min-height: 32px;
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

const StyledButton = styled(Button)`
  &&&& {
    width: 87px;
    height: 32px;
  }
`;

const AuthorizeButton = styled(StyledButton)`
  &&&& {
    width: 120px;
  }
`;

const COMMON_INPUT_PROPS: any = {
  name: "",
  formName: DATASOURCE_REST_API_FORM,
  id: "",
  isValid: false,
  controlType: "",
};

class DatasourceRestAPIEditor extends React.Component<Props> {
  componentDidMount = () => {
    const status = new URLSearchParams(this.props.location.search).get(
      "response_status",
    );
    if (status) {
      if (status === "success") {
        Toaster.show({
          text: OAUTH_AUTHORIZATION_SUCCESSFUL,
          variant: Variant.success,
        });
      } else {
        Toaster.show({
          text: OAUTH_AUTHORIZATION_FAILED,
          variant: Variant.danger,
        });
      }
    }
  };

  disableSave = () => {
    const { formData } = this.props;
    if (!formData) return true;
    return !formData.url;
  };

  save = (onSuccess?: ReduxAction<unknown>) => {
    const normalizedValues = formValuesToDatasource(
      this.props.datasource,
      this.props.formData,
    );
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.updateDatasource(normalizedValues, onSuccess);
  };

  createApiAction = () => {
    const { datasource, actions, pageId } = this.props;
    if (
      !datasource ||
      !datasource.datasourceConfiguration ||
      !datasource.datasourceConfiguration.url
    ) {
      Toaster.show({
        text: "Unable to create API. Try adding a url to the datasource",
        variant: Variant.danger,
      });
    }
    const newApiName = createNewApiName(actions, pageId || "");

    const headers =
      this.props.datasource?.datasourceConfiguration?.headers ?? [];
    const defaultApiActionConfig: ApiActionConfig = {
      ...DEFAULT_API_ACTION_CONFIG,
      headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
    };

    this.save(
      createActionRequest({
        name: newApiName,
        pageId: pageId,
        pluginId: datasource.pluginId,
        datasource: {
          id: datasource.id,
        },
        eventData: {
          actionType: "API",
          from: "datasource-pane",
        },
        actionConfiguration: defaultApiActionConfig,
      }),
    );
  };

  render = () => {
    return (
      <RestApiForm>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {this.renderHeader()}
          {this.renderEditor()}
          {this.renderSave()}
        </form>
      </RestApiForm>
    );
  };

  renderHeader = () => {
    const {
      isSaving,
      isNewDatasource,
      pluginImage,
      applicationId,
      pageId,
    } = this.props;
    return (
      <>
        <BackButton
          onClick={() =>
            history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId))
          }
        />
        <br />
        <Header>
          <FormTitleContainer>
            <PluginImage src={pluginImage} alt="Datasource" />
            <FormTitle focusOnMount={isNewDatasource} />
          </FormTitleContainer>

          <CreateApiButton
            className="t--create-query"
            icon={"plus"}
            text="New API"
            filled
            accent="primary"
            loading={isSaving}
            onClick={() => this.createApiAction()}
          />
        </Header>
      </>
    );
  };

  renderSave = () => {
    const { isDeleting, isSaving, datasourceId, deleteDatasource } = this.props;
    return (
      <SaveButtonContainer>
        <ActionButton
          className="t--delete-datasource"
          text="Delete"
          accent="error"
          loading={isDeleting}
          onClick={() => deleteDatasource(datasourceId)}
        />

        <StyledButton
          className="t--save-datasource"
          onClick={() => this.save()}
          text="Save"
          disabled={this.disableSave()}
          loading={isSaving}
          intent="primary"
          filled
          size="small"
        />
      </SaveButtonContainer>
    );
  };

  renderEditor = () => {
    const { formData } = this.props;
    if (!formData) return;
    return (
      <>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="URL"
            configProperty="url"
            isRequired={true}
            placeholderText="https://example.com"
          />
        </FormInputContainer>
        <FormInputContainer>
          <KeyValueInputControl
            {...COMMON_INPUT_PROPS}
            label="Headers"
            configProperty="headers"
          />
        </FormInputContainer>
        <FormInputContainer>
          <DropDownControl
            {...COMMON_INPUT_PROPS}
            label="Send Appsmith signature header (X-APPSMITH-SIGNATURE)"
            configProperty="isSendSessionEnabled"
            isRequired={true}
            placeholderText=""
            propertyValue=""
            options={[
              {
                label: "Yes",
                value: true,
              },
              {
                label: "No",
                value: false,
              },
            ]}
          />
        </FormInputContainer>
        {formData.isSendSessionEnabled && (
          <FormInputContainer>
            <InputTextControl
              {...COMMON_INPUT_PROPS}
              label="Session Details Signature Key"
              configProperty="sessionSignatureKey"
              placeholderText=""
            />
          </FormInputContainer>
        )}
        <FormInputContainer>
          <DropDownControl
            {...COMMON_INPUT_PROPS}
            label="Authentication Type"
            configProperty="authType"
            placeholderText=""
            propertyValue=""
            options={[
              {
                label: "None",
                value: AuthType.NONE,
              },
              {
                label: "OAuth 2.0",
                value: AuthType.OAuth2,
              },
            ]}
          />
        </FormInputContainer>
        {this.renderAuthFields()}
      </>
    );
  };

  renderAuthFields = () => {
    const { authType } = this.props.formData;

    let content;
    if (authType === AuthType.OAuth2) {
      content = this.renderOauth2();
    }
    if (content) {
      return (
        <Collapsible title="Authentication" defaultIsOpen={true}>
          {content}
        </Collapsible>
      );
    }
  };

  ensureOAuthDefaultsAreCorrect = () => {
    const { authentication } = this.props.formData;
    if (!authentication || !authentication.grantType) {
      this.props.change(
        "authentication.grantType",
        GrantType.ClientCredentials,
      );
      return false;
    }
    if (_.get(authentication, "isTokenHeader") === undefined) {
      this.props.change("authentication.isTokenHeader", true);
      return false;
    }

    if (authentication.grantType === GrantType.AuthorizationCode) {
      if (_.get(authentication, "isAuthorizationHeader") === undefined) {
        this.props.change("authentication.isAuthorizationHeader", true);
        return false;
      }
    }
    return true;
  };

  renderOauth2 = () => {
    if (!this.ensureOAuthDefaultsAreCorrect()) return;
    const { authentication } = this.props.formData;
    let content;
    switch (authentication?.grantType) {
      case GrantType.AuthorizationCode:
        content = this.renderOauth2AuthorizationCode();
        break;
      case GrantType.ClientCredentials:
        content = this.renderOauth2ClientCredentials();
        break;
    }

    return (
      <>
        <FormInputContainer>
          <DropDownControl
            {...COMMON_INPUT_PROPS}
            label="Grant Type"
            configProperty="authentication.grantType"
            placeholderText=""
            propertyValue=""
            options={[
              {
                label: "Client Credentials",
                value: GrantType.ClientCredentials,
              },
              {
                label: "Authorization Code",
                value: GrantType.AuthorizationCode,
              },
            ]}
          />
        </FormInputContainer>
        {content}
      </>
    );
  };

  renderOauth2Common = () => {
    const { formData } = this.props;
    return (
      <>
        <FormInputContainer>
          <DropDownControl
            {...COMMON_INPUT_PROPS}
            label="Add Access Token To"
            configProperty="authentication.isTokenHeader"
            options={[
              {
                label: "Request Header",
                value: true,
              },
              {
                label: "Request URL",
                value: false,
              },
            ]}
          />
        </FormInputContainer>
        {formData.authentication?.isTokenHeader && (
          <FormInputContainer>
            <InputTextControl
              {...COMMON_INPUT_PROPS}
              label="Header Prefix"
              configProperty="authentication.headerPrefix"
              placeholderText="Bearer (default)"
            />
          </FormInputContainer>
        )}
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Access Token URL"
            configProperty="authentication.accessTokenUrl"
            placeholderText="https://example.com/login/oauth/access_token"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Client ID"
            configProperty="authentication.clientId"
            placeholderText="Client ID"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Client Secret"
            dataType="PASSWORD"
            encrypted={true}
            configProperty="authentication.clientSecret"
            placeholderText="Client Secret"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Scope(s)"
            configProperty="authentication.scopeString"
            placeholderText="e.g. read, write"
          />
        </FormInputContainer>
      </>
    );
  };

  renderOauth2ClientCredentials = () => {
    return this.renderOauth2Common();
  };

  renderOauth2AuthorizationCode = () => {
    const { pageId, datasourceId, isSaving, datasource } = this.props;
    const isAuthorized = _.get(
      datasource,
      "datasourceConfiguration.authentication.isAuthorized",
      false,
    );
    return (
      <>
        {this.renderOauth2Common()}
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Authorization URL"
            configProperty="authentication.authorizationUrl"
            placeholderText="https://example.com/login/oauth/authorize"
          />
        </FormInputContainer>
        <FormInputContainer>
          <KeyValueInputControl
            {...COMMON_INPUT_PROPS}
            label="Custom Authentication Parameters"
            configProperty="authentication.customAuthenticationParameters"
          />
        </FormInputContainer>
        <FormInputContainer>
          <DropDownControl
            {...COMMON_INPUT_PROPS}
            label="Client Authentication"
            configProperty="authentication.isAuthorizationHeader"
            options={[
              {
                label: "Send as Basic Auth header",
                value: true,
              },
              {
                label: "Send client credentials in body",
                value: false,
              },
            ]}
          />
        </FormInputContainer>
        <FormInputContainer>
          <AuthorizeButton
            onClick={() =>
              this.save(redirectAuthorizationCode(pageId, datasourceId))
            }
            text={isAuthorized ? "Re-Authorize" : "Authorize"}
            intent="primary"
            loading={isSaving}
            filled
            size="small"
          />
        </FormInputContainer>
      </>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  return {
    initialValues: datasourceToFormValues(datasource),
    datasource: datasource,
    actions: state.entities.actions,
    formData: getFormValues(DATASOURCE_REST_API_FORM)(
      state,
    ) as ApiDatasourceForm,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) =>
      dispatch(updateDatasource(formData, onSuccess)),
    deleteDatasource: (id: string) => dispatch(deleteDatasource({ id })),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<ApiDatasourceForm, DatasourceRestApiEditorProps>({
    form: DATASOURCE_REST_API_FORM,
    enableReinitialize: true,
  })(DatasourceRestAPIEditor),
);
