import React from "react";
import styled from "styled-components";
import { createNewApiName } from "utils/AppsmithUtils";
import { DATASOURCE_REST_API_FORM } from "constants/forms";
import FormTitle from "./FormTitle";
import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import {
  getFormMeta,
  getFormValues,
  InjectedFormProps,
  reduxForm,
} from "redux-form";
import AnalyticsUtil from "utils/AnalyticsUtil";
import FormControl from "pages/Editor/FormControl";
import { StyledInfo } from "components/formControls/InputTextControl";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { ApiActionConfig, PluginType } from "entities/Action";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import { createActionRequest } from "actions/pluginActionActions";
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
  ApiKeyAuthType,
  AuthType,
  GrantType,
  SSLType,
} from "entities/Datasource/RestAPIForm";
import {
  createMessage,
  REST_API_AUTHORIZATION_APPSMITH_ERROR,
  REST_API_AUTHORIZATION_FAILED,
  REST_API_AUTHORIZATION_SUCCESSFUL,
} from "@appsmith/constants/messages";
import Collapsible from "./Collapsible";
import _ from "lodash";
import FormLabel from "components/editorComponents/FormLabel";
import CopyToClipBoard from "components/designSystems/appsmith/CopyToClipBoard";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";
import Callout from "components/ads/Callout";
import CloseEditor from "components/editorComponents/CloseEditor";
import { ButtonVariantTypes } from "components/constants";
import { updateReplayEntity } from "../../../actions/pageActions";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

interface DatasourceRestApiEditorProps {
  initializeReplayEntity: (id: string, data: any) => void;
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
  formMeta: any;
  messages?: Array<string>;
}

type Props = DatasourceRestApiEditorProps &
  InjectedFormProps<ApiDatasourceForm, DatasourceRestApiEditorProps>;

const RestApiForm = styled.div`
  flex: 1;
  padding: 20px;
  margin-left: 10px;
  margin-right: 0px;
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

const StyledButton = styled(Button)`
  &&&& {
    width: 87px;
    height: 32px;
  }
`;

const AuthorizeButton = styled(StyledButton)`
  &&&& {
    width: 180px;
  }
`;

class DatasourceRestAPIEditor extends React.Component<Props> {
  componentDidMount() {
    const search = new URLSearchParams(this.props.location.search);
    const status = search.get("response_status");

    // set replay data
    this.props.initializeReplayEntity(
      this.props.datasource.id,
      this.props.initialValues,
    );

    if (status) {
      const display_message = search.get("display_message");
      // Set default error message
      let message = REST_API_AUTHORIZATION_FAILED;
      let variant = Variant.danger;
      if (status === "success") {
        message = REST_API_AUTHORIZATION_SUCCESSFUL;
        variant = Variant.success;
      } else if (status === "appsmith_error") {
        message = REST_API_AUTHORIZATION_APPSMITH_ERROR;
      }
      Toaster.show({
        text: display_message || createMessage(message),
        variant,
      });
    }
  }

  componentDidUpdate() {
    if (!this.props.formData) return;

    const { authType } = this.props.formData;

    if (authType === AuthType.OAuth2) {
      this.ensureOAuthDefaultsAreCorrect();
    } else if (authType === AuthType.apiKey) {
      this.ensureAPIKeyDefaultsAreCorrect();
    }
  }

  isDirty(prop: any) {
    const { formMeta } = this.props;
    return _.get(formMeta, prop + ".visited", false);
  }

  ensureAPIKeyDefaultsAreCorrect = () => {
    if (!this.props.formData) return;
    const { authentication } = this.props.formData;
    if (!authentication || !_.get(authentication, "addTo")) {
      this.props.change("authentication.addTo", ApiKeyAuthType.Header);
    }
    if (!authentication || !_.get(authentication, "headerPrefix")) {
      this.props.change("authentication.headerPefix", "ApiKeyAuthType.Header");
    }
  };

  ensureOAuthDefaultsAreCorrect = () => {
    if (!this.props.formData) return;
    const { authentication } = this.props.formData;

    if (!authentication || !_.get(authentication, "grantType")) {
      this.props.change(
        "authentication.grantType",
        GrantType.ClientCredentials,
      );
    }
    if (_.get(authentication, "isTokenHeader") === undefined) {
      this.props.change("authentication.isTokenHeader", true);
    }
    if (
      !this.isDirty("authentication.headerPrefix") &&
      _.get(authentication, "headerPrefix") === undefined
    ) {
      this.props.change("authentication.headerPrefix", "Bearer");
    }

    if (_.get(authentication, "grantType") === GrantType.AuthorizationCode) {
      if (_.get(authentication, "isAuthorizationHeader") === undefined) {
        this.props.change("authentication.isAuthorizationHeader", true);
      }
    }

    if (_.get(authentication, "grantType") === GrantType.AuthorizationCode) {
      if (
        _.get(authentication, "sendScopeWithRefreshToken") === undefined ||
        _.get(authentication, "sendScopeWithRefreshToken") === ""
      ) {
        this.props.change("authentication.sendScopeWithRefreshToken", false);
      }
    }

    if (_.get(authentication, "grantType") === GrantType.AuthorizationCode) {
      if (
        _.get(authentication, "refreshTokenClientCredentialsLocation") ===
          undefined ||
        _.get(authentication, "refreshTokenClientCredentialsLocation") === ""
      ) {
        this.props.change(
          "authentication.refreshTokenClientCredentialsLocation",
          "BODY",
        );
      }
    }
  };

  disableSave = (): boolean => {
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
    const { actions, datasource, pageId } = this.props;
    if (
      !datasource ||
      !datasource.datasourceConfiguration ||
      !datasource.datasourceConfiguration.url
    ) {
      Toaster.show({
        text: "Unable to create API. Try adding a url to the datasource",
        variant: Variant.danger,
      });
      return;
    }
    const newApiName = createNewApiName(actions, pageId || "");

    const headers =
      this.props.datasource?.datasourceConfiguration?.headers ?? [];
    const queryParameters =
      this.props.datasource?.datasourceConfiguration?.queryParameters ?? [];
    const defaultApiActionConfig: ApiActionConfig = {
      ...DEFAULT_API_ACTION_CONFIG,
      headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
      queryParameters: queryParameters.length
        ? queryParameters
        : DEFAULT_API_ACTION_CONFIG.queryParameters,
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
      <>
        <CloseEditor />
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
      </>
    );
  };

  renderHeader = () => {
    const { isNewDatasource, pluginImage } = this.props;
    return (
      <Header>
        <FormTitleContainer>
          <PluginImage alt="Datasource" src={pluginImage} />
          <FormTitle focusOnMount={isNewDatasource} />
        </FormTitleContainer>
      </Header>
    );
  };

  renderSave = () => {
    const { datasourceId, deleteDatasource, isDeleting, isSaving } = this.props;
    return (
      <SaveButtonContainer>
        <ActionButton
          // accent="error"
          buttonStyle="DANGER"
          buttonVariant={ButtonVariantTypes.PRIMARY}
          className="t--delete-datasource"
          loading={isDeleting}
          onClick={() => deleteDatasource(datasourceId)}
          text="Delete"
        />

        <StyledButton
          className="t--save-datasource"
          disabled={this.disableSave()}
          filled
          intent="primary"
          loading={isSaving}
          onClick={() => this.save()}
          size="small"
          text="Save"
        />
      </SaveButtonContainer>
    );
  };

  renderEditor = () => {
    const { formData, messages } = this.props;
    if (!formData) return;
    return (
      <>
        {messages &&
          messages.map((msg, i) => (
            <Callout fill key={i} text={msg} variant={Variant.warning} />
          ))}
        <FormInputContainer data-replay-id={btoa("url")}>
          {this.renderInputTextControlViaFormControl(
            "url",
            "URL",
            "https://example.com",
            "TEXT",
            false,
            true,
          )}
        </FormInputContainer>
        <FormInputContainer data-replay-id={btoa("headers")}>
          {this.renderKeyValueControlViaFormControl(
            "headers",
            "Headers",
            "",
            false,
          )}
        </FormInputContainer>
        <FormInputContainer data-replay-id={btoa("queryParameters")}>
          {this.renderKeyValueControlViaFormControl(
            "queryParameters",
            "Query Parameters",
            "",
            false,
          )}
        </FormInputContainer>
        <FormInputContainer data-replay-id={btoa("isSendSessionEnabled")}>
          {this.renderDropdownControlViaFormControl(
            "isSendSessionEnabled",
            [
              {
                label: "Yes",
                value: true,
              },
              {
                label: "No",
                value: false,
              },
            ],
            "Send Appsmith signature header",
            "",
            true,
            "Header key: X-APPSMITH-SIGNATURE",
          )}
        </FormInputContainer>
        {formData.isSendSessionEnabled && (
          <FormInputContainer data-replay-id={btoa("sessionSignatureKey")}>
            {this.renderInputTextControlViaFormControl(
              "sessionSignatureKey",
              "Session Details Signature Key",
              "",
              "TEXT",
              false,
              false,
            )}
          </FormInputContainer>
        )}
        <FormInputContainer data-replay-id={btoa("authType")}>
          {this.renderDropdownControlViaFormControl(
            "authType",
            [
              {
                label: "None",
                value: AuthType.NONE,
              },
              {
                label: "Basic",
                value: AuthType.basic,
              },
              {
                label: "OAuth 2.0",
                value: AuthType.OAuth2,
              },
              {
                label: "API Key",
                value: AuthType.apiKey,
              },
              {
                label: "Bearer Token",
                value: AuthType.bearerToken,
              },
            ],
            "Authentication Type",
            "",
            false,
            "",
          )}
        </FormInputContainer>
        {this.renderAuthFields()}
        <FormInputContainer data-replay-id={btoa("ssl")}>
          {this.renderDropdownControlViaFormControl(
            "connection.ssl.authType",
            [
              {
                label: "No",
                value: "DEFAULT",
              },
              {
                label: "Yes",
                value: "SELF_SIGNED_CERTIFICATE",
              },
            ],
            "Use Self-signed certificate",
            "",
            true,
            "",
            "DEFAULT",
          )}
        </FormInputContainer>
        {this.renderSelfSignedCertificateFields()}
      </>
    );
  };

  renderSelfSignedCertificateFields = () => {
    const { connection } = this.props.formData;
    if (connection?.ssl.authType === SSLType.SELF_SIGNED_CERTIFICATE) {
      return (
        <Collapsible defaultIsOpen title="Certificate Details">
          {this.renderFilePickerControlViaFormControl(
            "connection.ssl.certificateFile",
            "Upload Certificate",
            "",
            false,
            true,
          )}
        </Collapsible>
      );
    }
  };

  renderAuthFields = () => {
    const { authType } = this.props.formData;

    let content;
    if (authType === AuthType.OAuth2) {
      content = this.renderOauth2();
    } else if (authType === AuthType.basic) {
      content = this.renderBasic();
    } else if (authType === AuthType.apiKey) {
      content = this.renderApiKey();
    } else if (authType === AuthType.bearerToken) {
      content = this.renderBearerToken();
    }
    if (content) {
      return (
        <Collapsible defaultIsOpen title="Authentication">
          {content}
        </Collapsible>
      );
    }
  };

  renderApiKey = () => {
    const { authentication } = this.props.formData;
    return (
      <>
        <FormInputContainer data-replay-id={btoa("authentication.label")}>
          {this.renderInputTextControlViaFormControl(
            "authentication.label",
            "Key",
            "api_key",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer>
          {this.renderInputTextControlViaFormControl(
            "authentication.value",
            "Value",
            "value",
            "TEXT",
            true,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer>
          {this.renderDropdownControlViaFormControl(
            "authentication.addTo",
            [
              {
                label: "Query Params",
                value: ApiKeyAuthType.QueryParams,
              },
              {
                label: "Header",
                value: ApiKeyAuthType.Header,
              },
            ],
            "Add To",
            "",
            false,
            "",
          )}
        </FormInputContainer>
        {_.get(authentication, "addTo") == "header" && (
          <FormInputContainer
            data-replay-id={btoa("authentication.headerPrefix")}
          >
            {this.renderInputTextControlViaFormControl(
              "authentication.headerPrefix",
              "Header Prefix",
              "eg: Bearer ",
              "TEXT",
              false,
              false,
            )}
          </FormInputContainer>
        )}
      </>
    );
  };

  renderBearerToken = () => {
    return (
      <FormInputContainer data-replay-id={btoa("authentication.bearerToken")}>
        {this.renderInputTextControlViaFormControl(
          "authentication.bearerToken",
          "Bearer Token",
          "Bearer Token",
          "TEXT",
          true,
          false,
        )}
      </FormInputContainer>
    );
  };

  renderBasic = () => {
    return (
      <>
        <FormInputContainer data-replay-id={btoa("authentication.username")}>
          {this.renderInputTextControlViaFormControl(
            "authentication.username",
            "Username",
            "Username",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer data-replay-id={btoa("authentication.password")}>
          {this.renderInputTextControlViaFormControl(
            "authentication.password",
            "Password",
            "Password",
            "PASSWORD",
            true,
            false,
          )}
        </FormInputContainer>
      </>
    );
  };

  renderOauth2 = () => {
    const { authentication } = this.props.formData;
    if (!authentication) return;
    let content;
    switch (_.get(authentication, "grantType")) {
      case GrantType.AuthorizationCode:
        content = this.renderOauth2AuthorizationCode();
        break;
      case GrantType.ClientCredentials:
        content = this.renderOauth2ClientCredentials();
        break;
    }

    return (
      <>
        <FormInputContainer data-replay-id={btoa("authentication.grantType")}>
          {this.renderDropdownControlViaFormControl(
            "authentication.grantType",
            [
              {
                label: "Client Credentials",
                value: GrantType.ClientCredentials,
              },
              {
                label: "Authorization Code",
                value: GrantType.AuthorizationCode,
              },
            ],
            "Grant Type",
            "",
            false,
            "",
          )}
        </FormInputContainer>
        {content}
      </>
    );
  };

  renderOauth2Common = () => {
    const { formData } = this.props;
    return (
      <>
        <FormInputContainer
          data-replay-id={btoa("authentication.isTokenHeader")}
        >
          {this.renderDropdownControlViaFormControl(
            "authentication.isTokenHeader",
            [
              {
                label: "Request Header",
                value: true,
              },
              {
                label: "Request URL",
                value: false,
              },
            ],
            "Add Access Token To",
            "",
            false,
            "",
          )}
        </FormInputContainer>
        {_.get(formData.authentication, "isTokenHeader") && (
          <FormInputContainer
            data-replay-id={btoa("authentication.headerPrefix")}
          >
            {this.renderInputTextControlViaFormControl(
              "authentication.headerPrefix",
              "Header Prefix",
              "eg: Bearer ",
              "TEXT",
              false,
              false,
            )}
          </FormInputContainer>
        )}
        <FormInputContainer
          data-replay-id={btoa("authentication.accessTokenUrl")}
        >
          {this.renderInputTextControlViaFormControl(
            "authentication.accessTokenUrl",
            "Access Token URL",
            "https://example.com/login/oauth/access_token",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer data-replay-id={btoa("authentication.clientId")}>
          {this.renderInputTextControlViaFormControl(
            "authentication.clientId",
            "Client ID",
            "Client ID",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer
          data-replay-id={btoa("authentication.clientSecret")}
        >
          {this.renderInputTextControlViaFormControl(
            "authentication.clientSecret",
            "Client Secret",
            "Client Secret",
            "PASSWORD",
            true,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer data-replay-id={btoa("authentication.scopeString")}>
          {this.renderInputTextControlViaFormControl(
            "authentication.scopeString",
            "Scope(s)",
            "e.g. read, write",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
      </>
    );
  };

  renderOauth2AdvancedSettings = () => {
    return (
      <>
        <FormInputContainer
          data-replay-id={btoa("authentication.sendScopeWithRefreshToken")}
        >
          {this.renderDropdownControlViaFormControl(
            "authentication.sendScopeWithRefreshToken",
            [
              {
                label: "Yes",
                value: true,
              },
              {
                label: "No",
                value: false,
              },
            ],
            "Send scope with refresh token",
            "",
            false,
            "",
          )}
        </FormInputContainer>
        <FormInputContainer
          data-replay-id={btoa(
            "authentication.refreshTokenClientCredentialsLocation",
          )}
        >
          {this.renderDropdownControlViaFormControl(
            "authentication.refreshTokenClientCredentialsLocation",
            [
              {
                label: "Body",
                value: "BODY",
              },
              {
                label: "Header",
                value: "HEADER",
              },
            ],
            "Send client credentials with",
            "",
            false,
            "",
          )}
        </FormInputContainer>
      </>
    );
  };

  renderOauth2CommonAdvanced = () => {
    return (
      <>
        <FormInputContainer data-replay-id={btoa("authentication.audience")}>
          {this.renderInputTextControlViaFormControl(
            "authentication.audience",
            "Audience",
            "https://example.com/oauth/audience",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer data-replay-id={btoa("authentication.resource")}>
          {this.renderInputTextControlViaFormControl(
            "authentication.resource",
            "Resource",
            "https://example.com/oauth/resource",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
      </>
    );
  };

  renderOauth2ClientCredentials = () => {
    return (
      <>
        {this.renderOauth2Common()}
        {this.renderOauth2CommonAdvanced()}
      </>
    );
  };

  renderOauth2AuthorizationCode = () => {
    const { datasource, datasourceId, formData, isSaving, pageId } = this.props;
    const isAuthorized = _.get(
      datasource,
      "datasourceConfiguration.authentication.isAuthorized",
      false,
    );
    const redirectURL =
      window.location.origin + "/api/v1/datasources/authorize";
    return (
      <>
        {this.renderOauth2Common()}
        <FormInputContainer
          data-replay-id={btoa("authentication.authorizationUrl")}
        >
          {this.renderInputTextControlViaFormControl(
            "authentication.authorizationUrl",
            "Authorization URL",
            "https://example.com/login/oauth/authorize",
            "TEXT",
            false,
            false,
          )}
        </FormInputContainer>
        <FormInputContainer>
          <div style={{ width: "20vw" }}>
            <FormLabel>
              Redirect URL
              <br />
              <StyledInfo>
                Url that the oauth server should redirect to
              </StyledInfo>
            </FormLabel>
            <CopyToClipBoard copyText={redirectURL} />
          </div>
        </FormInputContainer>
        <FormInputContainer
          data-replay-id={btoa("authentication.customAuthenticationParameters")}
        >
          {this.renderKeyValueControlViaFormControl(
            "authentication.customAuthenticationParameters",
            "Custom Authentication Parameters",
            "",
            false,
          )}
        </FormInputContainer>
        <FormInputContainer
          data-replay-id={btoa("authentication.isAuthorizationHeader")}
        >
          {this.renderDropdownControlViaFormControl(
            "authentication.isAuthorizationHeader",
            [
              {
                label: "Send as Basic Auth header",
                value: true,
              },
              {
                label: "Send client credentials in body",
                value: false,
              },
            ],
            "Client Authentication",
            "",
            false,
            "",
          )}
        </FormInputContainer>

        {!_.get(formData.authentication, "isAuthorizationHeader", true) &&
          this.renderOauth2CommonAdvanced()}
        <Collapsible title="Advanced Settings">
          {this.renderOauth2AdvancedSettings()}
        </Collapsible>
        <FormInputContainer>
          <AuthorizeButton
            disabled={this.disableSave()}
            filled
            intent="primary"
            loading={isSaving}
            onClick={() =>
              this.save(
                redirectAuthorizationCode(pageId, datasourceId, PluginType.API),
              )
            }
            size="small"
            text={isAuthorized ? "Save and Re-Authorize" : "Save and Authorize"}
          />
        </FormInputContainer>
      </>
    );
  };

  // All components in formControls must be rendered via FormControl.
  // FormControl is the common wrapper for all formcontrol components and contains common elements i.e. label, subtitle, helpertext
  renderInputTextControlViaFormControl(
    configProperty: string,
    label: string,
    placeholderText: string,
    dataType: "TEXT" | "PASSWORD" | "NUMBER",
    encrypted: boolean,
    isRequired: boolean,
  ) {
    return (
      <FormControl
        config={{
          id: "",
          isValid: false,
          isRequired: isRequired,
          controlType: "INPUT_TEXT",
          dataType: dataType,
          configProperty: configProperty,
          encrypted: encrypted,
          label: label,
          conditionals: {},
          placeholderText: placeholderText,
          formName: DATASOURCE_REST_API_FORM,
        }}
        formName={DATASOURCE_REST_API_FORM}
        multipleConfig={[]}
      />
    );
  }

  renderDropdownControlViaFormControl(
    configProperty: string,
    options: {
      label: string;
      value: string | boolean;
    }[],
    label: string,
    placeholderText: string,
    isRequired: boolean,
    subtitle?: string,
    initialValue?: any,
  ) {
    const config = {
      id: "",
      isValid: false,
      isRequired: isRequired,
      controlType: "DROP_DOWN",
      configProperty: configProperty,
      options: options,
      subtitle: subtitle,
      label: label,
      conditionals: {},
      placeholderText: placeholderText,
      formName: DATASOURCE_REST_API_FORM,
      initialValue: initialValue,
    };
    return (
      <FormControl
        config={config}
        formName={DATASOURCE_REST_API_FORM}
        multipleConfig={[]}
      />
    );
  }

  renderKeyValueControlViaFormControl(
    configProperty: string,
    label: string,
    placeholderText: string,
    isRequired: boolean,
  ) {
    const config = {
      id: "",
      configProperty: configProperty,
      isValid: false,
      controlType: "KEYVALUE_ARRAY",
      placeholderText: placeholderText,
      label: label,
      conditionals: {},
      formName: DATASOURCE_REST_API_FORM,
      isRequired: isRequired,
    };
    return (
      <FormControl
        config={config}
        formName={DATASOURCE_REST_API_FORM}
        multipleConfig={[]}
      />
    );
  }

  renderFilePickerControlViaFormControl(
    configProperty: string,
    label: string,
    placeholderText: string,
    isRequired: boolean,
    encrypted: boolean,
  ) {
    const config = {
      id: "",
      configProperty: configProperty,
      isValid: false,
      controlType: "FILE_PICKER",
      placeholderText: placeholderText,
      encrypted: encrypted,
      label: label,
      conditionals: {},
      formName: DATASOURCE_REST_API_FORM,
      isRequired: isRequired,
    };
    return (
      <FormControl
        config={config}
        formName={DATASOURCE_REST_API_FORM}
        multipleConfig={[]}
      />
    );
  }
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  const hintMessages = datasource && datasource.messages;

  return {
    initialValues: datasourceToFormValues(datasource),
    datasource: datasource,
    actions: state.entities.actions,
    formData: getFormValues(DATASOURCE_REST_API_FORM)(
      state,
    ) as ApiDatasourceForm,
    formMeta: getFormMeta(DATASOURCE_REST_API_FORM)(state),
    messages: hintMessages,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    initializeReplayEntity: (id: string, data: any) =>
      dispatch(updateReplayEntity(id, data, ENTITY_TYPE.DATASOURCE)),
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
