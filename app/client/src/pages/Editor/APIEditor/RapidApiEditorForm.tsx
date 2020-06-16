import React, { useEffect } from "react";
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
import { PaginationField, BodyFormData, Property } from "api/ActionAPI";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import CredentialsTooltip from "components/editorComponents/form/CredentialsTooltip";
import { FormIcons } from "icons/FormIcons";
import { BaseTabbedView } from "components/designSystems/appsmith/TabbedView";
import Pagination from "./Pagination";
import { PaginationType, RestAction } from "entities/Action";
import EntityNameComponent from "components/editorComponents/EntityNameComponent";
import { editApiName, saveApiName } from "actions/actionActions";
import { ApiNameValidation } from "reducers/uiReducers/apiPaneReducer";
import { NameWrapper } from "./Form";
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
  onSubmit: FormSubmitHandler<RestAction>;
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
  apiNameValidation: ApiNameValidation;
  dispatch: any;
}

type Props = APIFormProps & InjectedFormProps<RestAction, APIFormProps>;

const RapidApiEditorForm: React.FC<Props> = (props: Props) => {
  const {
    onDeleteClick,
    onRunClick,
    handleSubmit,
    isDeleting,
    isRunning,
    templateId,
    actionConfiguration,
    actionConfigurationHeaders,
    actionConfigurationBodyFormData,
    providerImage,
    providerURL,
    providerCredentialSteps,
    location,
    dispatch,
  } = props;

  const postbodyResponsePresent =
    templateId &&
    actionConfiguration &&
    actionConfigurationBodyFormData.length > 0;

  // let credentialStepsData;
  // if (providerCredentialSteps.length !== 0) {
  //   credentialStepsData = providerCredentialSteps.split("\\n");
  // }
  // console.log(credentialStepsData, "credentialStepsData");

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.SET_LAST_USED_EDITOR_PAGE,
      payload: {
        path: location.pathname,
      },
    });
  });

  // const abc = (text: string) => {
  //   console.log(text, "text");

  // }

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
            <EntityNameComponent
              value={props.apiName}
              onBlur={() => {
                dispatch(
                  saveApiName({
                    id: props.apiId,
                  }),
                );
              }}
              onChange={(e: any) => {
                dispatch(
                  editApiName({
                    id: props.apiId,
                    value: e.target.value,
                  }),
                );
              }}
              isValid={props.apiNameValidation.isValid}
              validationMessage={props.apiNameValidation.validationMessage}
              placeholder="nameOfApi (camel case)"
            ></EntityNameComponent>
            <a
              style={{
                paddingTop: "7px",
              }}
              className="t--apiDocumentationLink"
              target="_blank"
              rel="noopener noreferrer"
              href={providerURL && `http://${providerURL}`}
            >
              API documentation
            </a>
          </NameWrapper>

          <ActionButtons>
            <ActionButton
              text="Delete"
              accent="error"
              onClick={onDeleteClick}
              loading={isDeleting}
            />
            <ActionButton
              text="Run"
              filled
              accent="primary"
              onClick={() => {
                onRunClick();
              }}
              loading={isRunning}
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
            showLightningMenu={false}
          />
          <DynamicTextField
            placeholder="v1/method"
            name="actionConfiguration.path"
            leftIcon={FormIcons.SLASH_ICON}
            singleLine
            disabled={true}
            showLightningMenu={false}
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
                        name="actionConfiguration.headers"
                        label="Headers"
                        actionConfig={
                          actionConfiguration &&
                          actionConfigurationHeaders &&
                          actionConfigurationHeaders
                        }
                        pushFields={false}
                      />
                    </HeadersSection>
                    <KeyValueFieldArray
                      name="actionConfiguration.queryParameters"
                      label="Params"
                      pushFields={false}
                    />
                    {postbodyResponsePresent && (
                      <PostbodyContainer>
                        <FormLabel>{"Body"}</FormLabel>
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
