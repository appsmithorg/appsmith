import React from "react";
import { connect } from "react-redux";
import { reduxForm, InjectedFormProps, formValueSelector } from "redux-form";
import { POST_BODY_FORMAT_OPTIONS } from "constants/ApiEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { PaginationField, BodyFormData, Property } from "api/ActionAPI";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import CredentialsTooltip from "components/editorComponents/form/CredentialsTooltip";
import { FormIcons } from "icons/FormIcons";
import { BaseTabbedView } from "components/designSystems/appsmith/TabbedView";
import Pagination from "./Pagination";
import { PaginationType, Action } from "entities/Action";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import { NameWrapper } from "./Form";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";
import { getActionData } from "../../../selectors/entitiesSelector";
import { AppState } from "reducers";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  min-height: 95vh;
  max-height: 95vh;
  overflow: auto;
  width: 100%;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    padding: ${(props) => props.theme.spaces[2]}px;
    & > * {
      margin-right: 10px;
    }
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
  }
`;

const MainConfiguration = styled.div`
  padding-top: 10px;
  padding-left: 17px;
  span.bp3-popover-target {
    display: inline-block;
  }
`;

const SecondaryWrapper = styled.div`
  display: flex;
  height: calc(100% - 120px);
  border-top: 1px solid #d0d7dd;
  margin-top: 10px;
`;

const RequestParamsWrapper = styled.div`
  flex: 4;
  border-right: 1px solid #d0d7dd;
  height: 100%;
  overflow-y: auto;
  padding-top: 6px;
  padding-left: 17px;
  padding-right: 10px;
`;

const ActionButtons = styled.div`
  flex: 1;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    margin: 0 5px;
    min-height: 30px;
  }
`;

const PostbodyContainer = styled.div`
  margin-top: 41px;
`;

const HeadersSection = styled.div`
  margin-bottom: 32px;
`;

const TabbedViewContainer = styled.div`
  flex: 1;
  padding-top: 12px;
`;

interface APIFormProps {
  onRunClick: (paginationField?: PaginationField) => void;
  onDeleteClick: () => void;
  isRunning: boolean;
  isDeleting: boolean;
  paginationType: PaginationType;
  appName: string;
  templateId: string;
  actionConfiguration?: any;
  actionConfigurationHeaders?: Property[];
  displayFormat: string;
  actionConfigurationBodyFormData: BodyFormData[];
  providerImage: string;
  providerURL: string;
  providerCredentialSteps: string;
  location: {
    pathname: string;
  };
  apiName: string;
  apiId: string;
  dispatch: any;
  responseDataTypes: { key: string; title: string }[];
  responseDisplayFormat: { title: string; value: string };
}

type Props = APIFormProps & InjectedFormProps<Action, APIFormProps>;

function RapidApiEditorForm(props: Props) {
  const {
    actionConfiguration,
    actionConfigurationBodyFormData,
    actionConfigurationHeaders,
    handleSubmit,
    isDeleting,
    isRunning,
    onDeleteClick,
    onRunClick,
    providerCredentialSteps,
    providerImage,
    providerURL,
    responseDataTypes,
    responseDisplayFormat,
    templateId,
  } = props;

  const postbodyResponsePresent =
    templateId &&
    actionConfiguration &&
    actionConfigurationBodyFormData &&
    actionConfigurationBodyFormData.length > 0;

  return (
    <Form
      onSubmit={handleSubmit}
      style={{
        height: "100%",
      }}
    >
      <MainConfiguration>
        <FormRow>
          <NameWrapper>
            <ActionNameEditor />
            <a
              className="t--apiDocumentationLink"
              href={providerURL && `http://${providerURL}`}
              rel="noopener noreferrer"
              style={{
                paddingTop: "7px",
              }}
              target="_blank"
            >
              API documentation
            </a>
          </NameWrapper>

          <ActionButtons>
            <ActionButton
              buttonStyle="DANGER"
              loading={isDeleting}
              onClick={onDeleteClick}
              text="Delete"
            />
            <ActionButton
              buttonStyle="PRIMARY"
              loading={isRunning}
              onClick={() => {
                onRunClick();
              }}
              text="Run"
            />
          </ActionButtons>
        </FormRow>
        <FormRow>
          <DynamicTextField
            disabled
            leftImage={providerImage}
            name="provider.name"
            placeholder="Provider name"
          />
          <DynamicTextField
            disabled
            leftIcon={FormIcons.SLASH_ICON}
            name="actionConfiguration.path"
            placeholder="v1/method"
          />
        </FormRow>
        {/* Display How to get Credentials info if it is present */}
        {providerCredentialSteps && providerCredentialSteps !== "" && (
          <CredentialsTooltip
            providerCredentialSteps={providerCredentialSteps}
          />
        )}
      </MainConfiguration>
      <SecondaryWrapper>
        <TabbedViewContainer>
          <BaseTabbedView
            tabs={[
              {
                key: "apiInput",
                title: "API Input",
                panelComponent: (
                  <RequestParamsWrapper>
                    <HeadersSection>
                      <KeyValueFieldArray
                        actionConfig={
                          actionConfiguration &&
                          actionConfigurationHeaders &&
                          actionConfigurationHeaders
                        }
                        label="Headers"
                        name="actionConfiguration.headers"
                        pushFields={false}
                      />
                    </HeadersSection>
                    <KeyValueFieldArray
                      label="Params"
                      name="actionConfiguration.queryParameters"
                      pushFields={false}
                    />
                    {postbodyResponsePresent && (
                      <PostbodyContainer>
                        <FormLabel>{"Body"}</FormLabel>
                        {typeof actionConfigurationBodyFormData ===
                          "object" && (
                          <KeyValueFieldArray
                            actionConfig={actionConfigurationBodyFormData}
                            addOrDeleteFields={false}
                            label=""
                            name="actionConfiguration.bodyFormData"
                            pushFields={false}
                            rightIcon={FormIcons.INFO_ICON}
                          />
                        )}
                      </PostbodyContainer>
                    )}
                  </RequestParamsWrapper>
                ),
              },
              {
                key: "pagination",
                title: "Pagination",
                panelComponent: (
                  <Pagination
                    onTestClick={props.onRunClick}
                    paginationType={props.paginationType}
                  />
                ),
              },
            ]}
          />
        </TabbedViewContainer>

        <ApiResponseView
          apiName={props.apiName}
          onRunClick={onRunClick}
          responseDataTypes={responseDataTypes}
          responseDisplayFormat={responseDisplayFormat}
        />
      </SecondaryWrapper>
    </Form>
  );
}

const selector = formValueSelector(API_EDITOR_FORM_NAME);

export default connect((state: AppState) => {
  const displayFormat = selector(state, "displayFormat");
  const providerImage = selector(state, "provider.imageUrl");
  const providerURL = selector(state, "provider.url");
  const providerCredentialSteps = selector(state, "provider.credentialSteps");
  const templateId = selector(state, "templateId");
  const actionConfiguration = selector(state, "actionConfiguration");
  let actionConfigurationBodyFormData = selector(
    state,
    "actionConfiguration.bodyFormData",
  );
  const actionConfigurationHeaders = selector(
    state,
    "actionConfiguration.headers",
  );

  if (
    typeof actionConfigurationBodyFormData === "string" &&
    (displayFormat.value === POST_BODY_FORMAT_OPTIONS.JSON ||
      displayFormat.value === POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED)
  ) {
    actionConfigurationBodyFormData = JSON.parse(
      `${actionConfigurationBodyFormData}`,
    );
  }
  const actionData = getActionData(state, actionConfiguration.id);
  let responseDisplayFormat: { title: string; value: string };
  let responseDataTypes: { key: string; title: string }[];
  if (!!actionData && actionData.responseDisplayFormat) {
    responseDataTypes = actionData.dataTypes.map((data) => {
      return {
        key: data.dataType,
        title: data.dataType,
      };
    });
    responseDisplayFormat = {
      title: actionData.responseDisplayFormat,
      value: actionData.responseDisplayFormat,
    };
  } else {
    responseDataTypes = [];
    responseDisplayFormat = {
      title: "JSON",
      value: "JSON",
    };
  }

  return {
    displayFormat,
    actionConfiguration,
    actionConfigurationHeaders,
    actionConfigurationBodyFormData,
    providerImage,
    providerURL,
    responseDataTypes,
    responseDisplayFormat,
    templateId,
    providerCredentialSteps,
  };
})(
  reduxForm<Action, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
    destroyOnUnmount: false,
  })(RapidApiEditorForm),
);
