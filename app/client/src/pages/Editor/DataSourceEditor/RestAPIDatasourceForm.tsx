import React from "react";
import styled from "styled-components";
import _ from "lodash";
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
import { ApiActionConfig, Property } from "entities/Action";
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

const COMMON_INPUT_PROPS: any = {
  name: "",
  formName: DATASOURCE_REST_API_FORM,
  id: "",
  isValid: false,
  controlType: "",
};

class DatasourceRestAPIEditor extends React.Component<Props> {
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
                label: "OAuth2 (Client credentials)",
                value: AuthType.OAuth2ClientCredentials,
              },
              // {
              //   label: "OAuth2 (Auth Code)",
              //   value: AuthType.OAuth2AuthorizationCode,
              // },
            ]}
          />
        </FormInputContainer>
        {this.renderAuthFields()}
      </>
    );
  };

  renderAuthFields = () => {
    const { authType } = this.props.formData;

    if (authType === AuthType.OAuth2ClientCredentials) {
      return this.renderOauth2ClientCredentials();
    }
    if (authType === AuthType.OAuth2AuthorizationCode) {
      return this.renderOauth2AuthorizationCode();
    }
  };

  renderOauth2Common = () => {
    return (
      <>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Client Id"
            configProperty="authentication.clientId"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Client Secret"
            dataType="PASSWORD"
            encrypted={true}
            configProperty="authentication.clientSecret"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Scope(s)"
            configProperty="authentication.scopeString"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Access Token URL"
            configProperty="authentication.accessTokenUrl"
          />
        </FormInputContainer>
        <FormInputContainer>
          <DropDownControl
            {...COMMON_INPUT_PROPS}
            label="Add token to"
            configProperty="authentication.isTokenHeader"
            options={[
              {
                label: "Header",
                value: true,
              },
              {
                label: "Query parameters",
                value: false,
              },
            ]}
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Header Prefix"
            configProperty="authentication.headerPrefix"
            placeholderText="Bearer (default)"
          />
        </FormInputContainer>
      </>
    );
  };
  renderOauth2ClientCredentials = () => {
    return this.renderOauth2Common();
  };
  renderOauth2AuthorizationCode = () => {
    const { datasourceId, isSaving } = this.props;
    return (
      <>
        {this.renderOauth2Common()}
        <FormInputContainer>
          <InputTextControl
            {...COMMON_INPUT_PROPS}
            label="Authorization URL"
            configProperty="authentication.authorizationUrl"
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
            label="Add authorization to"
            configProperty="authentication.isAuthorizationHeader"
            options={[
              {
                label: "Header",
                value: true,
              },
              {
                label: "Body",
                value: false,
              },
            ]}
          />
        </FormInputContainer>
        <FormInputContainer>
          <StyledButton
            onClick={() => this.save(redirectAuthorizationCode(datasourceId))}
            text="Authorize"
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

const cleanupProperties = (values: Property[] | undefined): Property[] => {
  if (!Array.isArray(values)) return [];

  const newValues: Property[] = [];
  values.forEach((object: Property) => {
    const isEmpty = Object.values(object).every((x) => x === "");
    if (!isEmpty) {
      newValues.push(object);
    }
  });
  return newValues;
};

enum AuthType {
  NONE = "NONE",
  OAuth2ClientCredentials = "oAuth2-client-credentials",
  OAuth2AuthorizationCode = "oAuth2-authorization-code",
}

type Authentication = ClientCredentials | AuthorizationCode;
interface ApiDatasourceForm {
  datasourceId: string;
  pluginId: string;
  organizationId: string;
  isValid: boolean;
  url: string;
  headers?: Property[];
  isSendSessionEnabled: boolean;
  sessionSignatureKey: string;
  authType: AuthType;
  authentication?: Authentication;
}

interface Oauth2Common {
  authenticationType: "oAuth2";
  accessTokenUrl: string;
  clientId: string;
  clientSecret: string;
  headerPrefix: string;
  scopeString: string;
  isTokenHeader: boolean;
}

interface ClientCredentials extends Oauth2Common {
  grantType: "client_credentials";
}

interface AuthorizationCode extends Oauth2Common {
  grantType: "authorization_code";
  authorizationUrl: string;
  customAuthenticationParameters: Property[];
  isAuthorizationHeader: boolean;
}

const getFormAuthType = (datasource: Datasource): AuthType => {
  const dsAuthType = _.get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
  );
  const dsGrantType = _.get(
    datasource,
    "datasourceConfiguration.authentication.grantType",
  );

  if (dsAuthType) {
    if (dsGrantType === "client_credentials") {
      return AuthType.OAuth2ClientCredentials;
    } else if (dsGrantType === "authorization_code") {
      return AuthType.OAuth2AuthorizationCode;
    }
  }
  return AuthType.NONE;
};

const isClientCredentials = (
  authType: AuthType,
  val: any,
): val is ClientCredentials => {
  if (authType === AuthType.OAuth2ClientCredentials) return true;
  return false;
};

const isAuthorizationCode = (
  authType: AuthType,
  val: any,
): val is AuthorizationCode => {
  if (authType === AuthType.OAuth2AuthorizationCode) return true;
  return false;
};

const datasourceToFormAuthentication = (
  authType: AuthType,
  datasource: Datasource,
): Authentication | undefined => {
  if (
    !datasource ||
    !datasource.datasourceConfiguration ||
    !datasource.datasourceConfiguration.authentication
  ) {
    return;
  }
  const authentication = datasource.datasourceConfiguration.authentication;
  if (
    isClientCredentials(authType, authentication) ||
    isAuthorizationCode(authType, authentication)
  ) {
    const oAuth2Common: Oauth2Common = {
      authenticationType: "oAuth2",
      accessTokenUrl: authentication.accessTokenUrl || "",
      clientId: authentication.clientId || "",
      headerPrefix: authentication.headerPrefix || "",
      scopeString: authentication.scopeString || "",
      clientSecret: authentication.clientSecret,
      isTokenHeader: !!authentication.isTokenHeader,
    };
    if (isClientCredentials(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: "client_credentials",
      };
    }
    if (isAuthorizationCode(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: "authorization_code",
        authorizationUrl: authentication.authorizationUrl || "",
        customAuthenticationParameters: cleanupProperties(
          authentication.customAuthenticationParameters,
        ),
        isAuthorizationHeader:
          typeof authentication.isAuthorizationHeader === "undefined"
            ? true
            : !!authentication.isAuthorizationHeader,
      };
    }
  }
};

const formToDatasourceAuthentication = (
  authType: AuthType,
  authentication: Authentication | undefined,
): Authentication | null => {
  if (authType === AuthType.NONE || !authentication) return null;
  if (
    isClientCredentials(authType, authentication) ||
    isAuthorizationCode(authType, authentication)
  ) {
    const oAuth2Common: Oauth2Common = {
      authenticationType: "oAuth2",
      accessTokenUrl: authentication.accessTokenUrl,
      clientId: authentication.clientId,
      headerPrefix: authentication.headerPrefix,
      scopeString: authentication.scopeString,
      clientSecret: authentication.clientSecret,
      isTokenHeader: authentication.isTokenHeader,
    };
    if (isClientCredentials(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: "client_credentials",
      };
    }
    if (isAuthorizationCode(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: "authorization_code",
        authorizationUrl: authentication.authorizationUrl,
        isAuthorizationHeader: authentication.isAuthorizationHeader,
        customAuthenticationParameters: cleanupProperties(
          authentication.customAuthenticationParameters,
        ),
      };
    }
  }
  return null;
};

const datasourceToFormValues = (datasource: Datasource): ApiDatasourceForm => {
  const authType = getFormAuthType(datasource);
  const authentication = datasourceToFormAuthentication(authType, datasource);
  const isSendSessionEnabled =
    _.get(datasource, "datasourceConfiguration.properties[0].value") === "Y";
  const sessionSignatureKey = isSendSessionEnabled
    ? _.get(datasource, "datasourceConfiguration.properties[1].value")
    : "";
  return {
    datasourceId: datasource.id,
    organizationId: datasource.organizationId,
    pluginId: datasource.pluginId,
    isValid: datasource.isValid,
    url: datasource.datasourceConfiguration.url,
    headers: cleanupProperties(datasource.datasourceConfiguration.headers),
    isSendSessionEnabled: isSendSessionEnabled,
    sessionSignatureKey: sessionSignatureKey,
    authType: authType,
    authentication: authentication,
  };
};

const formValuesToDatasource = (
  datasource: Datasource,
  form: ApiDatasourceForm,
): Datasource => {
  const authentication = formToDatasourceAuthentication(
    form.authType,
    form.authentication,
  );

  return {
    ...datasource,
    datasourceConfiguration: {
      url: form.url,
      headers: cleanupProperties(form.headers),
      properties: [
        {
          key: "isSendSessionEnabled",
          value: form.isSendSessionEnabled ? "Y" : "N",
        },
        { key: "sessionSignatureKey", value: form.sessionSignatureKey },
      ],
      authentication: authentication,
    },
  } as Datasource;
};

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
