import React from "react";
import { connect } from "react-redux";
import {
  reduxForm,
  InjectedFormProps,
  FormSubmitHandler,
  formValueSelector,
} from "redux-form";
import { POST_BODY_FORMAT_OPTIONS } from "constants/ApiEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import {
  RestAction,
  PaginationField,
  BodyFormData,
  Property,
} from "api/ActionAPI";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import { FormIcons } from "icons/FormIcons";
import { BaseTabbedView } from "components/designSystems/appsmith/TabbedView";
import Pagination, { PaginationType } from "./Pagination";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  min-height: 95vh;
  max-height: 95vh;
  overflow: auto;
  width: 100%;
  ${FormLabel} {
    padding: ${props => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    padding: ${props => props.theme.spaces[2]}px;
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
`;

const SecondaryWrapper = styled.div`
  display: flex;
  height: 100%;
  border-top: 1px solid #d0d7dd;
  margin-top: 15px;
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

const DropDownContainer = styled.div`
  margin: 5px;
  margin-bottom: 21px;
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
  allowSave: boolean;
  onSubmit: FormSubmitHandler<RestAction>;
  onSaveClick: () => void;
  onRunClick: (paginationField?: PaginationField) => void;
  onDeleteClick: () => void;
  isSaving: boolean;
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
}

type Props = APIFormProps & InjectedFormProps<RestAction, APIFormProps>;

const RapidApiEditorForm: React.FC<Props> = (props: Props) => {
  const {
    allowSave,
    onSaveClick,
    onDeleteClick,
    onRunClick,
    handleSubmit,
    isDeleting,
    isRunning,
    isSaving,
    templateId,
    actionConfiguration,
    actionConfigurationHeaders,
    actionConfigurationBodyFormData,
    providerImage,
    providerURL,
  } = props;

  const postbodyResponsePresent =
    templateId &&
    actionConfiguration &&
    actionConfigurationBodyFormData.length > 0;

  return (
    <Form onSubmit={handleSubmit}>
      {isSaving && <LoadingOverlayScreen>Saving...</LoadingOverlayScreen>}
      <MainConfiguration>
        <FormRow>
          <DynamicTextField
            placeholder="Api name"
            name="name"
            singleLine
            link={providerURL && `http://${providerURL}`}
          />
          <ActionButtons>
            <ActionButton
              text="Delete"
              accent="error"
              onClick={onDeleteClick}
              loading={isDeleting}
            />
            <ActionButton
              text="Run"
              accent="secondary"
              onClick={() => {
                onRunClick();
              }}
              loading={isRunning}
            />
            <ActionButton
              text="Save"
              accent="primary"
              filled
              onClick={onSaveClick}
              loading={isSaving}
              disabled={!allowSave}
            />
          </ActionButtons>
        </FormRow>
        <FormRow>
          <DynamicTextField
            placeholder="Provider name"
            name="provider.name"
            singleLine
            leftImage={providerImage}
            disabled={true}
          />
          <DynamicTextField
            placeholder="v1/method"
            name="actionConfiguration.path"
            leftIcon={FormIcons.SLASH_ICON}
            singleLine
            disabled={true}
          />
        </FormRow>
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
                        name="actionConfiguration.headers"
                        label="Headers"
                        actionConfig={
                          actionConfiguration &&
                          actionConfigurationHeaders &&
                          actionConfigurationHeaders
                        }
                      />
                    </HeadersSection>
                    <KeyValueFieldArray
                      name="actionConfiguration.queryParameters"
                      label="Params"
                    />
                    {postbodyResponsePresent && (
                      <PostbodyContainer>
                        <FormLabel>{"Post Body"}</FormLabel>
                        <DropDownContainer>
                          <DropdownField
                            placeholder={POST_BODY_FORMAT_OPTIONS[1].value}
                            name="displayFormat"
                            isSearchable={false}
                            width={232}
                            options={POST_BODY_FORMAT_OPTIONS}
                            isDisabled={true}
                          />
                        </DropDownContainer>
                        {typeof actionConfigurationBodyFormData ===
                          "object" && (
                          <React.Fragment>
                            <KeyValueFieldArray
                              name="actionConfiguration.bodyFormData"
                              label=""
                              rightIcon={FormIcons.INFO_ICON}
                              addOrDeleteFields={false}
                              actionConfig={actionConfigurationBodyFormData}
                              pushFields={false}
                            />
                          </React.Fragment>
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

        <ApiResponseView />
      </SecondaryWrapper>
    </Form>
  );
};

const selector = formValueSelector(API_EDITOR_FORM_NAME);

export default connect(state => {
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
    (displayFormat === POST_BODY_FORMAT_OPTIONS[0].value ||
      displayFormat === POST_BODY_FORMAT_OPTIONS[1].value)
  ) {
    actionConfigurationBodyFormData = JSON.parse(
      `${actionConfigurationBodyFormData}`,
    );
  }
  return {
    displayFormat,
    actionConfiguration,
    actionConfigurationHeaders,
    actionConfigurationBodyFormData,
    providerImage,
    providerURL,
    templateId,
    providerCredentialSteps,
  };
})(
  reduxForm<RestAction, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
    destroyOnUnmount: false,
  })(RapidApiEditorForm),
);
