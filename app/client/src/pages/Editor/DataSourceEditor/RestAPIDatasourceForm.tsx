import React from "react";
import styled from "styled-components";
import { DATASOURCE_REST_API_FORM } from "ee/constants/forms";
import type { Datasource } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import { getFormMeta, reduxForm } from "redux-form";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import FormControl from "pages/Editor/FormControl";
import { StyledInfo } from "components/formControls/InputTextControl";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import { Callout } from "@appsmith/ads";
import {
  createDatasourceFromForm,
  toggleSaveActionFlag,
  updateDatasource,
} from "actions/datasourceActions";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  datasourceToFormValues,
  formValuesToDatasource,
} from "PluginActionEditor/transformers/RestAPIDatasourceFormTransformer";
import type {
  ApiDatasourceForm,
  AuthorizationCode,
  ClientCredentials,
} from "entities/Datasource/RestAPIForm";
import {
  ApiKeyAuthType,
  AuthType,
  GrantType,
} from "entities/Datasource/RestAPIForm";
import { createMessage, INVALID_URL } from "ee/constants/messages";
import Collapsible from "./Collapsible";
import _ from "lodash";
import FormLabel from "components/editorComponents/FormLabel";
import CopyToClipBoard from "components/designSystems/appsmith/CopyToClipBoard";
import { updateReplayEntity } from "actions/pageActions";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { Form } from "./DBForm";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { getHasManageDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

interface DatasourceRestApiEditorProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeReplayEntity: (id: string, data: any) => void;
  updateDatasource: (
    formValues: Datasource,
    currEditingEnvId: string,
    onSuccess?: ReduxAction<unknown>,
  ) => void;
  currentEnvironment: string;
  currentEnvironmentName: string;
  isSaving: boolean;
  applicationId: string;
  datasourceId: string;
  pageId: string;
  location: {
    search: string;
  };
  datasource: Datasource;
  formData: ApiDatasourceForm;
  formName: string;
  pluginName: string;
  pluginPackageName: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formMeta: any;
  messages?: Array<string>;
  datasourceName: string;
  createDatasource: (
    data: Datasource,
    onSuccess?: ReduxAction<unknown>,
  ) => void;
  toggleSaveActionFlag: (flag: boolean) => void;
  triggerSave?: boolean;
  datasourceDeleteTrigger: () => void;
  viewMode: boolean;
  isFeatureEnabled: boolean;
}

type Props = DatasourceRestApiEditorProps &
  InjectedFormProps<ApiDatasourceForm, DatasourceRestApiEditorProps>;

const FormInputContainer = styled.div`
  margin-top: 16px;
  .t--save-and-authorize-datasource {
    margin-left: 0;
  }
`;

class DatasourceRestAPIEditor extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }
  componentDidMount() {
    // set replay data
    this.props.initializeReplayEntity(
      this.props.datasource.id,
      this.props.initialValues,
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.props.formData) return;

    const { authType } = this.props.formData;

    if (authType === AuthType.OAuth2) {
      this.ensureOAuthDefaultsAreCorrect();
    } else if (authType === AuthType.apiKey) {
      this.ensureAPIKeyDefaultsAreCorrect();
    }

    // if trigger save changed, save datasource
    if (
      prevProps.triggerSave !== this.props.triggerSave &&
      this.props.triggerSave
    ) {
      this.save();
    }
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    if (_.get(authentication, "grantType") === GrantType.ClientCredentials) {
      if (_.get(authentication, "isAuthorizationHeader") === undefined) {
        this.props.change("authentication.isAuthorizationHeader", false);
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

  validate = (): boolean => {
    const { datasource, datasourceId, formData, isFeatureEnabled } = this.props;
    const createMode = datasourceId === TEMP_DATASOURCE_ID;
    const canManageDatasource = getHasManageDatasourcePermission(
      isFeatureEnabled,
      datasource?.userPermissions || [],
    );

    if (!formData) return true;

    return !formData.url || (!createMode && !canManageDatasource);
  };

  getSanitizedFormData = () =>
    formValuesToDatasource(
      this.props.datasource,
      this.props.formData,
      this.props.currentEnvironment,
    );

  save = (onSuccess?: ReduxAction<unknown>) => {
    this.props.toggleSaveActionFlag(true);
    const normalizedValues = this.getSanitizedFormData();

    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
      environmentId: this.props.currentEnvironment,
      environmentName: this.props.currentEnvironmentName,
      pluginName: this.props.pluginName || "",
      pluginPackageName: this.props.pluginPackageName || "",
    });

    if (this.props.datasource.id !== TEMP_DATASOURCE_ID) {
      return this.props.updateDatasource(
        normalizedValues,
        this.props.currentEnvironment,
        onSuccess,
      );
    }

    this.props.createDatasource(
      {
        ...normalizedValues,
        name: this.props.datasourceName,
      },
      onSuccess,
    );
  };

  urlValidator = (value: string) => {
    const validationRegex = "^(http|https)://";

    if (value) {
      const regex = new RegExp(validationRegex);

      return regex.test(value)
        ? { isValid: true, message: "" }
        : {
            isValid: false,
            message: createMessage(INVALID_URL),
          };
    }

    return { isValid: true, message: "" };
  };

  render = () => {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        viewMode={this.props.viewMode}
      >
        {this.renderEditor()}
      </Form>
    );
  };

  renderEditor = () => {
    const { formData, messages } = this.props;

    if (!formData) return;

    return (
      <>
        {messages &&
          messages.map((msg, i) => (
            <Callout key={i} kind="warning">
              {msg}
            </Callout>
          ))}
        {this.renderGeneralSettings()}
        {this.renderOauth2AdvancedSettings()}
      </>
    );
  };

  renderGeneralSettings = () => {
    const { formData } = this.props;

    return (
      <section
        className="t--section-general"
        data-location-id="section-General"
        data-testid="section-General"
      >
        <FormInputContainer data-location-id={btoa("url")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "url",
            label: "URL",
            placeholderText: "https://example.com",
            dataType: "TEXT",
            encrypted: false,
            isRequired: true,
            fieldValidator: this.urlValidator,
          })}
        </FormInputContainer>
        <FormInputContainer data-location-id={btoa("isSendSessionEnabled")}>
          {this.renderCheckboxViaFormControl(
            "isSendSessionEnabled",
            "Send Appsmith signature header",
            "",
            false,
          )}
        </FormInputContainer>
        {formData.isSendSessionEnabled && (
          <FormInputContainer data-location-id={btoa("sessionSignatureKey")}>
            {this.renderInputTextControlViaFormControl({
              configProperty: "sessionSignatureKey",
              label: "Session details signature key",
              placeholderText: "",
              dataType: "TEXT",
              encrypted: false,
              isRequired: false,
            })}
          </FormInputContainer>
        )}
        <FormInputContainer data-location-id={btoa("ssl")}>
          {this.renderCheckboxViaFormControl(
            "connection.ssl.authTypeControl",
            "Use Self-Signed Certificate",
            "",
            false,
          )}
        </FormInputContainer>
        {this.renderSelfSignedCertificateFields()}
        <Collapsible title="Headers">
          <FormInputContainer
            className="t--headers-array"
            data-location-id={btoa("headers")}
          >
            {this.renderKeyValueControlViaFormControl("headers", "", "", false)}
          </FormInputContainer>
        </Collapsible>
        <Collapsible title="Query parameters">
          <FormInputContainer data-location-id={btoa("queryParameters")}>
            {this.renderKeyValueControlViaFormControl(
              "queryParameters",
              "",
              "",
              false,
            )}
          </FormInputContainer>
        </Collapsible>
        <Collapsible title="Authentication">
          <FormInputContainer data-location-id={btoa("authType")}>
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
                  label: "API key",
                  value: AuthType.apiKey,
                },
                {
                  label: "Bearer token",
                  value: AuthType.bearerToken,
                },
              ],
              "Authentication type",
              "",
              false,
              "",
            )}
            {this.renderAuthFields()}
          </FormInputContainer>
        </Collapsible>
      </section>
    );
  };

  renderSelfSignedCertificateFields = () => {
    const { connection } = this.props.formData;

    if (connection?.ssl.authTypeControl) {
      return (
        <div style={{ marginTop: "16px" }}>
          {this.renderFilePickerControlViaFormControl(
            "connection.ssl.certificateFile",
            "Upload Certificate",
            "",
            false,
            true,
          )}
        </div>
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
      return content;
    }
  };

  renderApiKey = () => {
    const { authentication } = this.props.formData;

    return (
      <>
        <FormInputContainer data-location-id={btoa("authentication.label")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.label",
            label: "Key",
            placeholderText: "api_key",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
          })}
        </FormInputContainer>
        <FormInputContainer>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.value",
            label: "Value",
            placeholderText: "value",
            dataType: "TEXT",
            encrypted: true,
            isRequired: false,
          })}
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
            data-location-id={btoa("authentication.headerPrefix")}
          >
            {this.renderInputTextControlViaFormControl({
              configProperty: "authentication.headerPrefix",
              label: "Header prefix",
              placeholderText: "eg: Bearer ",
              dataType: "TEXT",
              encrypted: false,
              isRequired: false,
            })}
          </FormInputContainer>
        )}
      </>
    );
  };

  renderBearerToken = () => {
    return (
      <FormInputContainer data-location-id={btoa("authentication.bearerToken")}>
        {this.renderInputTextControlViaFormControl({
          configProperty: "authentication.bearerToken",
          label: "Bearer token",
          placeholderText: "Bearer token",
          dataType: "TEXT",
          encrypted: true,
          isRequired: false,
        })}
      </FormInputContainer>
    );
  };

  renderBasic = () => {
    return (
      <>
        <FormInputContainer data-location-id={btoa("authentication.username")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.username",
            label: "Username",
            placeholderText: "Username",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
          })}
        </FormInputContainer>
        <FormInputContainer data-location-id={btoa("authentication.password")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.password",
            label: "Password",
            placeholderText: "Password",
            dataType: "PASSWORD",
            encrypted: true,
            isRequired: false,
            isSecretExistsPath: "authentication.secretExists.password",
          })}
        </FormInputContainer>
      </>
    );
  };

  renderOauth2 = () => {
    const authentication = this.props.formData.authentication as
      | ClientCredentials
      | AuthorizationCode
      | undefined;

    if (!authentication) return;

    let content;

    switch (authentication.grantType) {
      case GrantType.AuthorizationCode:
        content = this.renderOauth2AuthorizationCode();
        break;
      case GrantType.ClientCredentials:
        content = this.renderOauth2ClientCredentials();
        break;
    }

    return (
      <>
        <FormInputContainer data-location-id={btoa("authentication.grantType")}>
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
            "Grant type",
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
          data-location-id={btoa("authentication.isTokenHeader")}
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
            !!_.get(formData.authentication, "isTokenHeader"),
          )}
        </FormInputContainer>
        {_.get(formData.authentication, "isTokenHeader") && (
          <FormInputContainer
            data-location-id={btoa("authentication.headerPrefix")}
          >
            {this.renderInputTextControlViaFormControl({
              configProperty: "authentication.headerPrefix",
              label: "Header prefix",
              placeholderText: "eg: Bearer ",
              dataType: "TEXT",
              encrypted: false,
              isRequired: false,
            })}
          </FormInputContainer>
        )}
        <FormInputContainer
          data-location-id={btoa("authentication.accessTokenUrl")}
        >
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.accessTokenUrl",
            label: "Access token URL",
            placeholderText: "https://example.com/login/oauth/access_token",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
            fieldValidator: this.urlValidator,
          })}
        </FormInputContainer>
        <FormInputContainer data-location-id={btoa("authentication.clientId")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.clientId",
            label: "Client ID",
            placeholderText: "Client ID",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
          })}
        </FormInputContainer>
        <FormInputContainer
          data-location-id={btoa("authentication.clientSecret")}
        >
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.clientSecret",
            label: "Client secret",
            placeholderText: "Client secret",
            dataType: "PASSWORD",
            encrypted: true,
            isRequired: false,
            isSecretExistsPath: "authentication.secretExists.clientSecret",
          })}
        </FormInputContainer>
        <FormInputContainer
          data-location-id={btoa("authentication.scopeString")}
        >
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.scopeString",
            label: "Scope(s)",
            placeholderText: "e.g. read, write",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
          })}
        </FormInputContainer>
        <FormInputContainer
          data-location-id={btoa("authentication.isAuthorizationHeader")}
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
            !!_.get(formData.authentication, "isAuthorizationHeader"),
          )}
        </FormInputContainer>
      </>
    );
  };

  renderOauth2AdvancedSettings = () => {
    const { authentication, authType, connection } = this.props.formData;
    const isGrantTypeAuthorizationCode =
      _.get(authentication, "grantType") === GrantType.AuthorizationCode;
    const isAuthenticationTypeOAuth2 = authType === AuthType.OAuth2;
    const isConnectSelfSigned = _.get(connection, "ssl.authTypeControl");

    if (
      !isAuthenticationTypeOAuth2 ||
      !(isGrantTypeAuthorizationCode || isConnectSelfSigned)
    )
      return null;

    return (
      <Collapsible title="Advanced Settings">
        {isGrantTypeAuthorizationCode && (
          <FormInputContainer
            data-location-id={btoa("authentication.sendScopeWithRefreshToken")}
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
              !!_.get(authentication, "sendScopeWithRefreshToken"),
            )}
          </FormInputContainer>
        )}
        {isGrantTypeAuthorizationCode && (
          <FormInputContainer
            data-location-id={btoa(
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
              "Send client credentials with (on refresh token):",
              "",
              false,
              "",
            )}
          </FormInputContainer>
        )}
        {isConnectSelfSigned && (
          <FormInputContainer
            data-location-id={btoa("authentication.useSelfSignedCert")}
          >
            {this.renderCheckboxViaFormControl(
              "authentication.useSelfSignedCert",
              "Use Self-Signed Certificate for Authorization requests",
              "",
              false,
            )}
          </FormInputContainer>
        )}
      </Collapsible>
    );
  };

  renderOauth2CommonAdvanced = () => {
    return (
      <>
        <FormInputContainer data-location-id={btoa("authentication.audience")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.audience",
            label: "Audience",
            placeholderText: "https://example.com/oauth/audience",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
          })}
        </FormInputContainer>
        <FormInputContainer data-location-id={btoa("authentication.resource")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.resource",
            label: "Resource",
            placeholderText: "https://example.com/oauth/resource",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
          })}
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
    const { formData } = this.props;

    const redirectURL =
      window.location.origin + "/api/v1/datasources/authorize";

    return (
      <>
        {this.renderOauth2Common()}
        <FormInputContainer
          data-location-id={btoa("authentication.authorizationUrl")}
        >
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.authorizationUrl",
            label: "Authorization URL",
            placeholderText: "https://example.com/login/oauth/authorize",
            dataType: "TEXT",
            encrypted: false,
            isRequired: false,
          })}
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
          data-location-id={btoa(
            "authentication.customAuthenticationParameters",
          )}
        >
          {this.renderKeyValueControlViaFormControl(
            "authentication.customAuthenticationParameters",
            "Custom Authentication Parameters",
            "",
            false,
          )}
        </FormInputContainer>
        <FormInputContainer data-location-id={btoa("authentication.expiresIn")}>
          {this.renderInputTextControlViaFormControl({
            configProperty: "authentication.expiresIn",
            label: "Authorization expires in (seconds)",
            placeholderText: "3600",
            dataType: "NUMBER",
            encrypted: false,
            isRequired: false,
          })}
        </FormInputContainer>

        {!_.get(formData.authentication, "isAuthorizationHeader", true) &&
          this.renderOauth2CommonAdvanced()}
      </>
    );
  };

  // All components in formControls must be rendered via FormControl.
  // FormControl is the common wrapper for all formcontrol components and contains common elements i.e. label, subtitle, helpertext
  renderInputTextControlViaFormControl({
    configProperty,
    dataType,
    encrypted,
    fieldValidator,
    isRequired,
    isSecretExistsPath,
    label,
    placeholderText,
  }: {
    configProperty: string;
    label: string;
    placeholderText: string;
    dataType: "TEXT" | "PASSWORD" | "NUMBER";
    encrypted: boolean;
    isRequired: boolean;
    fieldValidator?: (value: string) => { isValid: boolean; message: string };
    isSecretExistsPath?: string;
  }) {
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
          formName: this.props.formName,
          validator: fieldValidator,
          isSecretExistsPath,
        }}
        formName={this.props.formName}
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      formName: this.props.formName,
      initialValue: initialValue,
    };

    return (
      <FormControl
        config={config}
        formName={this.props.formName}
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
      formName: this.props.formName,
      isRequired: isRequired,
    };

    return (
      <FormControl
        config={config}
        formName={this.props.formName}
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
      formName: this.props.formName,
      isRequired: isRequired,
    };

    return (
      <FormControl
        config={config}
        formName={this.props.formName}
        multipleConfig={[]}
      />
    );
  }

  renderCheckboxViaFormControl(
    configProperty: string,
    label: string,
    placeholderText: string,
    isRequired: boolean,
  ) {
    return (
      <FormControl
        config={{
          id: "",
          isValid: false,
          isRequired: isRequired,
          controlType: "CHECKBOX",
          configProperty: configProperty,
          label: label,
          conditionals: {},
          placeholderText: placeholderText,
          formName: this.props.formName,
        }}
        formName={this.props.formName}
      />
    );
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, props: any) => {
  const { currentEnvironment, datasource, formName } = props;
  const hintMessages = datasource && datasource.messages;

  const isFeatureEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.license_gac_enabled,
  );

  return {
    initialValues: datasourceToFormValues(datasource, currentEnvironment),
    formMeta: getFormMeta(formName)(state),
    messages: hintMessages,
    datasourceName: datasource?.name ?? "",
    isFeatureEnabled,
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => {
  return {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initializeReplayEntity: (id: string, data: any) =>
      dispatch(updateReplayEntity(id, data, ENTITY_TYPE.DATASOURCE)),
    updateDatasource: (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formData: any,
      currEditingEnvId: string,
      onSuccess?: ReduxAction<unknown>,
    ) => dispatch(updateDatasource(formData, currEditingEnvId, onSuccess)),
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) =>
      dispatch(createDatasourceFromForm(formData, onSuccess)),
    toggleSaveActionFlag: (flag: boolean) =>
      dispatch(toggleSaveActionFlag(flag)),
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
