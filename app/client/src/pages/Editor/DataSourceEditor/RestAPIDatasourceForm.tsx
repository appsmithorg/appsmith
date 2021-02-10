// eslint-disable
import React from "react";
import styled from "styled-components";
import _ from "lodash";
import { createNewApiName } from "utils/AppsmithUtils";
import { DATASOURCE_REST_API_FORM } from "constants/forms";
import {
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";
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
import { Spinner } from "@blueprintjs/core";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Action, ApiActionConfig, Property } from "entities/Action";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { getCurrentPageId } from "selectors/editorSelectors";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import { createActionRequest } from "actions/actionActions";
import { updateDatasource } from "actions/datasourceActions";

interface DatasourceRestApiEditorProps {
  updateDatasource: (formValues: Datasource) => void;
  handleDelete: (id: string) => void;
  createActionRequest: (data: Partial<Action>) => void;
  selectedPluginPackage: string;
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  applicationId: string;
  pageId: string;
  isNewDatasource: boolean;
  pluginImage: string;
  viewMode: boolean;
  pluginType: string;
  datasource: Datasource;
  formData: ApiDatasourceForm;
  actions: ActionDataState;
  currentPageId?: string;
}

interface DatasourceDBEditorState {
  viewMode: boolean;
}

type Props = DatasourceRestApiEditorProps &
  InjectedFormProps<ApiDatasourceForm, DatasourceRestApiEditorProps>;

const DBForm = styled.div`
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

class DatasourceRestAPIEditor extends React.Component<
  Props,
  DatasourceDBEditorState
> {
  disableSave = () => {
    const { formData } = this.props;
    if (!formData) return true;
    return !formData.url;
  };

  render() {
    const { loadingFormConfigs } = this.props;
    if (loadingFormConfigs) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }
    const content = this.renderDataSourceConfigForm();
    return <DBForm>{content}</DBForm>;
  }

  isNewDatasource = () => {
    const { datasource } = this.props;
    if (!datasource) return false;

    return datasource.id && datasource.id.includes(":");
  };

  save = () => {
    const normalizedValues = formValuesToDatasource(
      this.props.datasource,
      this.props.formData,
    ) as Datasource;
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.updateDatasource(normalizedValues);
  };

  renderDataSourceConfigForm = () => {
    const {
      isSaving,
      applicationId,
      pageId,
      isDeleting,
      datasource,
      handleDelete,
    } = this.props;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <BackButton
          onClick={() =>
            history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId))
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
            onClick={() => this.createApiAction()}
          />
        </Header>
        <>
          {this.renderEditor()}
          <SaveButtonContainer>
            <ActionButton
              className="t--delete-datasource"
              text="Delete"
              accent="error"
              loading={isDeleting}
              onClick={() => datasource && handleDelete(datasource.id)}
            />

            <StyledButton
              className="t--save-datasource"
              onClick={this.save}
              text="Save"
              disabled={this.disableSave()}
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

  common(): any {
    return {
      name: "",
      formName: DATASOURCE_REST_API_FORM,
      id: "",
      isValid: false,
      controlType: "",
    };
  }

  createApiAction() {
    const { datasource, actions, currentPageId } = this.props;
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
    const newApiName = createNewApiName(actions, currentPageId || "");

    const headers =
      this.props.datasource?.datasourceConfiguration?.headers ?? [];
    const defaultApiActionConfig: ApiActionConfig = {
      ...DEFAULT_API_ACTION_CONFIG,
      headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
    };

    this.props.createActionRequest({
      name: newApiName,
      pageId: currentPageId,
      pluginId: datasource.pluginId,
      datasource: {
        id: datasource.id,
      },
      eventData: {
        actionType: "API",
        from: "datasource-pane",
      },
      actionConfiguration: defaultApiActionConfig,
    });
    history.push(
      API_EDITOR_URL_WITH_SELECTED_PAGE_ID(
        this.props.applicationId,
        currentPageId,
        currentPageId,
      ),
    );
  }

  renderEditor = () => {
    const { formData } = this.props;
    if (!formData) return;
    const common = this.common();
    return (
      <>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="URL"
            configProperty="url"
            isRequired={true}
            placeholderText="https://example.com"
          />
        </FormInputContainer>
        <FormInputContainer>
          <KeyValueInputControl
            {...common}
            label="Headers"
            configProperty="headers"
          />
        </FormInputContainer>
        <FormInputContainer>
          <DropDownControl
            {...common}
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
              {...common}
              label="Session Details Signature Key"
              configProperty="sessionSignatureKey"
              placeholderText=""
            />
          </FormInputContainer>
        )}
        <FormInputContainer>
          <DropDownControl
            {...common}
            label="Authentication Type"
            configProperty="authType"
            placeholderText=""
            propertyValue=""
            options={[
              {
                label: "None",
                value: "NONE",
              },
              {
                label: "OAuth2 (Client credentials)",
                value: "oAuth2-client-credentials",
              },
              // Uncomment for oauth2-auth-code flow
              // {
              //   label: "OAuth2 (Auth Code)",
              //   value: "oAuth2-auth-code",
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
    const common = this.common();
    return (
      <>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Client Id"
            configProperty="authentication.clientId"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Client Secret"
            dataType="PASSWORD"
            configProperty="authentication.clientSecret"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Scope(s)"
            configProperty="authentication.scopeString"
          />
        </FormInputContainer>
      </>
    );
  };
  renderOauth2ClientCredentials = () => {
    const common: any = this.common();
    return (
      <>
        {this.renderOauth2Common()}
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Access Token URL"
            configProperty="authentication.accessTokenUrl"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Header Prefix"
            configProperty="authentication.headerPrefix"
            placeholderText="Bearer (default)"
          />
        </FormInputContainer>
        <FormInputContainer>
          <DropDownControl
            {...common}
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
      </>
    );
  };
  renderOauth2AuthorizationCode = () => {
    const common: any = this.common();
    return (
      <>
        {this.renderOauth2Common()}
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Authorization URL"
            configProperty="authentication.authorizationUrl"
          />
        </FormInputContainer>
        <FormInputContainer>
          <KeyValueInputControl
            {...common}
            label="Custom Authentication Parameters"
            configProperty="authentication.customAuthenticationParameters"
          />
        </FormInputContainer>
      </>
    );
  };
}

enum AuthType {
  NONE = "NONE",
  OAuth2ClientCredentials = "oAuth2-client-credentials",
  OAuth2AuthorizationCode = "oAuth2-authorization-code",
}

type Authentication = ClientCredentials | AuthCode;
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

interface ClientCredentials {
  authenticationType: "oAuth2";
  grantType: "client_credentials";
  accessTokenUrl: string;
  clientId: string;
  headerPrefix: string;
  scopeString: string;
  clientSecret: string;
  isTokenHeader: boolean;
}

interface AuthCode {
  authenticationType: "oAuth2";
  grantType: "authorization_code";
  clientId: string;
  clientSecret: string;
  scopeString: string;
  authorizationUrl: string;
  customAuthenticationParameters: Property[];
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
  if (isClientCredentials(authType, authentication)) {
    return {
      authenticationType: "oAuth2",
      grantType: "client_credentials",
      accessTokenUrl: authentication.accessTokenUrl || "",
      clientId: authentication.clientId || "",
      headerPrefix: authentication.headerPrefix || "",
      scopeString: authentication.scopeString || "",
      clientSecret: authentication.clientSecret,
      isTokenHeader: !!authentication.isTokenHeader,
    };
  } else if (isAuthCode(authType, authentication)) {
    return {
      authenticationType: "oAuth2",
      grantType: "authorization_code",
      clientId: authentication.clientId || "",
      scopeString: authentication.scopeString || "",
      authorizationUrl: authentication.authorizationUrl || "",
      clientSecret: authentication.clientSecret,
      customAuthenticationParameters: cleanupProperties(
        authentication.customAuthenticationParameters,
      ),
    };
  }
};

const isClientCredentials = (
  authType: AuthType,
  val: any,
): val is ClientCredentials => {
  if (authType === AuthType.OAuth2ClientCredentials) return true;
  return false;
};

const isAuthCode = (authType: AuthType, val: any): val is AuthCode => {
  if (authType === AuthType.OAuth2AuthorizationCode) return true;
  return false;
};

const formToDatasourceAuthentication = (
  authType: AuthType,
  authentication: Authentication | undefined,
): Authentication | null => {
  if (authType === AuthType.NONE || !authentication) return null;
  if (isClientCredentials(authType, authentication)) {
    return {
      authenticationType: "oAuth2",
      grantType: "client_credentials",
      accessTokenUrl: authentication.accessTokenUrl,
      clientId: authentication.clientId,
      headerPrefix: authentication.headerPrefix,
      scopeString: authentication.scopeString,
      clientSecret: authentication.clientSecret,
      isTokenHeader: authentication.isTokenHeader,
    };
  } else if (isAuthCode(authType, authentication)) {
    return {
      authenticationType: "oAuth2",
      grantType: "authorization_code",
      clientId: authentication.clientId,
      clientSecret: authentication.clientSecret,
      scopeString: authentication.scopeString,
      authorizationUrl: authentication.authorizationUrl,
      customAuthenticationParameters: cleanupProperties(
        authentication.customAuthenticationParameters,
      ),
    };
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
) => {
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
  };
};

const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  return {
    initialValues: datasourceToFormValues(datasource),
    datasource: datasource,
    actions: state.entities.actions,
    currentPageId: getCurrentPageId(state),
    formData: getFormValues(DATASOURCE_REST_API_FORM)(
      state,
    ) as ApiDatasourceForm,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    createActionRequest: (data: Partial<Action>) =>
      dispatch(createActionRequest(data)),
    updateDatasource: (formData: any) => {
      dispatch(updateDatasource(formData));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<ApiDatasourceForm, DatasourceRestApiEditorProps>({
    form: DATASOURCE_REST_API_FORM,
  })(DatasourceRestAPIEditor),
);
