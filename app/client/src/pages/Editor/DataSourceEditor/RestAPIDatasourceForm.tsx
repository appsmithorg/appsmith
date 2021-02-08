import React from "react";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import history from "utils/history";
import FormTitle from "./FormTitle";
import Connected from "./Connected";
import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps } from "redux-form";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import AnalyticsUtil from "utils/AnalyticsUtil";
import BackButton from "./BackButton";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import InputTextControl from "components/formControls/InputTextControl";
import KeyValueInputControl from "components/formControls/KeyValueInputControl";
import DropDownControl from "components/formControls/DropDownControl";
import { Spinner } from "@blueprintjs/core";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

// TODO: move property paths to constants here.
interface DatasourceDBEditorProps {
  onSave: (formValues: Datasource) => void;
  onTest: (formValus: Datasource) => void;
  handleDelete: (id: string) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
  selectedPluginPackage: string;
  isSaving: boolean;
  isDeleting: boolean;
  datasourceId: string;
  loadingFormConfigs: boolean;
  applicationId: string;
  pageId: string;
  formData: Datasource;
  isTesting: boolean;
  formConfig: any[];
  isNewDatasource: boolean;
  pluginImage: string;
  viewMode: boolean;
  pluginType: string;
}

interface DatasourceDBEditorState {
  viewMode: boolean;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

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

const StyledButton = styled(Button)`
  &&&& {
    width: 87px;
    height: 32px;
  }
`;

class DatasourceDBEditor extends React.Component<
  Props,
  DatasourceDBEditorState
> {
  constructor(props: Props) {
    super(props);

    this.state = {
      viewMode: true,
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.datasourceId !== this.props.datasourceId) {
      this.props.setDatasourceEditorMode(this.props.datasourceId, true);
    }
  }

  validate = () => {
    const requiredFields = [
      "datasourceConfiguration.url",
      "datasourceConfiguration.properties[0].value",
    ];

    const errors = {} as any;
    const values = this.props.formData;

    requiredFields.forEach((fieldConfigProperty) => {
      const value = _.get(values, fieldConfigProperty);
      if (!value) {
        _.set(errors, fieldConfigProperty, "This field is required");
      }
    });

    return !_.isEmpty(errors) || this.props.invalid;
  };

  render() {
    const { loadingFormConfigs, formConfig } = this.props;
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
    const { datasourceId } = this.props;

    return datasourceId.includes(":");
  };

  normalizeValues = () => {
    let { formData } = this.props;

    const headersProperty = "datasourceConfiguration.headers";
    // Fix headers
    const values = _.get(formData, headersProperty);
    const newValues: ({ [s: string]: unknown } | ArrayLike<unknown>)[] = [];
    values.forEach((object: { [s: string]: unknown } | ArrayLike<unknown>) => {
      const isEmpty = Object.values(object).every((x) => x === "");
      if (!isEmpty) {
        newValues.push(object);
      }
    });
    formData = _.set(formData, headersProperty, newValues);

    // Ensure issendSession enabled key exists
    // This is a weird hack because we do not have anything other than
    const isSendSessionEnabledKeyProperty =
      "datasourceConfiguration.properties[0].key";
    formData = _.set(
      formData,
      isSendSessionEnabledKeyProperty,
      "isSendSessionEnabled",
    );
    const isSendSessionEnabledValueProperty =
      "datasourceConfiguration.properties[0].value";

    let isSendSessionEnabled = _.get(
      formData,
      isSendSessionEnabledValueProperty,
    );
    if (!["Y", "N"].includes(isSendSessionEnabled)) {
      isSendSessionEnabled = "N";
      formData = _.set(
        formData,
        isSendSessionEnabledValueProperty,
        isSendSessionEnabled,
      );
    }

    // Fix session signature key
    const sessionSignatureKeyProperty =
      "datasourceConfiguration.properties[1].key";
    formData = _.set(
      formData,
      sessionSignatureKeyProperty,
      "sessionSignatureKey",
    );

    // Fix authentication
    const authTypeProperty =
      "datasourceConfiguration.authentication.authenticationType";
    const authProperty = "datasourceConfiguration.authentication";
    const authType = _.get(formData, authTypeProperty);
    // Todo: fix to add more types
    if (authType !== "oAuth2") {
      formData = _.set(formData, authProperty, null);
    }
    return formData;
  };

  save = () => {
    const normalizedValues = this.normalizeValues();
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.onSave(normalizedValues);
  };

  test = () => {
    const normalizedValues = this.normalizeValues();
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.onTest(normalizedValues);
  };

  renderDataSourceConfigForm = () => {
    const {
      isSaving,
      applicationId,
      pageId,
      isTesting,
      isDeleting,
      datasourceId,
      handleDelete,
      viewMode,
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
          {viewMode && (
            <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
              <ActionButton
                className="t--edit-datasource"
                text="EDIT"
                accent="secondary"
                onClick={() => {
                  this.props.setDatasourceEditorMode(
                    this.props.datasourceId,
                    false,
                  );
                }}
              />
            </Boxed>
          )}
        </Header>
        {!viewMode ? (
          <>
            {this.renderEditor()}
            <SaveButtonContainer>
              <ActionButton
                className="t--delete-datasource"
                text="Delete"
                accent="error"
                loading={isDeleting}
                onClick={() => handleDelete(datasourceId)}
              />

              <ActionButton
                className="t--test-datasource"
                text="Test"
                loading={isTesting}
                accent="secondary"
                onClick={this.test}
              />
              <StyledButton
                className="t--save-datasource"
                onClick={this.save}
                text="Save"
                disabled={this.validate()}
                loading={isSaving}
                intent="primary"
                filled
                size="small"
              />
            </SaveButtonContainer>
          </>
        ) : (
          <Connected />
        )}
      </form>
    );
  };

  renderEditor = () => {
    const { formData } = this.props;
    const isSendSessionEnabled =
      _.get(formData, "datasourceConfiguration.properties[0].value") === "Y";

    const common = {
      name: "",
      formName: DATASOURCE_DB_FORM,
      id: "",
      isValid: false,
      controlType: "",
    };
    return (
      <>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="URL"
            configProperty="datasourceConfiguration.url"
            isRequired={true}
            placeholderText="https://example.com"
          />
        </FormInputContainer>
        <FormInputContainer>
          <KeyValueInputControl
            {...common}
            label="Headers"
            configProperty="datasourceConfiguration.headers"
          />
        </FormInputContainer>
        <FormInputContainer>
          <DropDownControl
            {...common}
            label="Send Appsmith signature header (X-APPSMITH-SIGNATURE)"
            configProperty="datasourceConfiguration.properties[0].value"
            isRequired={true}
            placeholderText=""
            propertyValue=""
            options={[
              {
                label: "Yes",
                value: "Y",
              },
              {
                label: "No",
                value: "N",
              },
            ]}
          />
        </FormInputContainer>
        {isSendSessionEnabled && (
          <FormInputContainer>
            <InputTextControl
              {...common}
              label="Session Details Signature Key"
              configProperty="datasourceConfiguration.properties[1].value"
              placeholderText=""
            />
          </FormInputContainer>
        )}
        <FormInputContainer>
          <DropDownControl
            {...common}
            label="Authentication Type"
            configProperty="datasourceConfiguration.authentication.authenticationType"
            placeholderText=""
            propertyValue=""
            options={[
              {
                label: "None",
                value: "dbAuth",
              },
              {
                label: "OAuth2 (Client credentials)",
                value: "oAuth2",
              },
            ]}
          />
        </FormInputContainer>
        {this.renderAuthFields(common)}
      </>
    );
  };

  renderAuthFields = (common: any) => {
    const { formData } = this.props;
    const isAuthTypeOauth2 =
      _.get(
        formData,
        "datasourceConfiguration.authentication.authenticationType",
      ) === "oAuth2";
    if (!isAuthTypeOauth2) return null;

    return (
      <>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Access Token URL"
            configProperty="datasourceConfiguration.authentication.accessTokenUrl"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Client Id"
            configProperty="datasourceConfiguration.authentication.clientId"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Client Secret"
            dataType="PASSWORD"
            configProperty="datasourceConfiguration.authentication.clientSecret"
          />
        </FormInputContainer>
        <FormInputContainer>
          <InputTextControl
            {...common}
            label="Header Prefix"
            configProperty="datasourceConfiguration.authentication.headerPrefix"
            placeholderText="Bearer (default)"
          />
        </FormInputContainer>
        <FormInputContainer>
          <DropDownControl
            {...common}
            label="Add token to"
            configProperty="datasourceConfiguration.authentication.isTokenHeader"
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
}

export default reduxForm<Datasource, DatasourceDBEditorProps>({
  form: DATASOURCE_DB_FORM,
})(DatasourceDBEditor);
