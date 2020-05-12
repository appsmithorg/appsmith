import React, { useEffect } from "react";
import { connect } from "react-redux";
import {
  reduxForm,
  InjectedFormProps,
  FormSubmitHandler,
  formValueSelector,
} from "redux-form";
import {
  HTTP_METHOD_OPTIONS,
  HTTP_METHODS,
} from "constants/ApiEditorConstants";
import styled from "styled-components";
import PostBodyData from "./PostBodyData";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { RestAction, PaginationField } from "api/ActionAPI";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import TextField from "components/editorComponents/form/fields/TextField";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import DatasourcesField from "components/editorComponents/form/fields/DatasourcesField";
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
  height: calc(100vh - ${props => props.theme.headerHeight});
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

const HeadersSection = styled.div`
  margin-bottom: 32px;
`;

const DatasourceWrapper = styled.div`
  width: 100%;
  max-width: 320px;
`;

const TabbedViewContainer = styled.div`
  flex: 1;
  padding-top: 12px;
`;

interface APIFormProps {
  pluginId: string;
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
  actionConfiguration?: any;
  httpMethodFromForm: string;
  actionConfigurationBody: object | string;
  actionConfigurationHeaders?: any;
  contentType: {
    key: string;
    value: string;
  };
  location: {
    pathname: string;
  };
  dispatch: any;
}

type Props = APIFormProps & InjectedFormProps<RestAction, APIFormProps>;

const ApiEditorForm: React.FC<Props> = (props: Props) => {
  const {
    pluginId,
    allowSave,
    onSaveClick,
    onDeleteClick,
    onRunClick,
    handleSubmit,
    isDeleting,
    isRunning,
    isSaving,
    actionConfiguration,
    actionConfigurationHeaders,
    actionConfigurationBody,
    httpMethodFromForm,
    location,
    dispatch,
  } = props;
  const allowPostBody =
    httpMethodFromForm && httpMethodFromForm !== HTTP_METHODS[0];
  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.SET_LAST_USED_EDITOR_PAGE,
      payload: {
        path: location.pathname,
      },
    });
  });

  return (
    <Form onSubmit={handleSubmit}>
      {isSaving && <LoadingOverlayScreen>Saving...</LoadingOverlayScreen>}
      <MainConfiguration>
        <FormRow>
          <TextField
            name="name"
            placeholder="nameOfApi (camel case)"
            showError
            className="t--nameOfApi"
          />
          <ActionButtons className="t--formActionButtons">
            <ActionButton
              text="Delete"
              accent="error"
              onClick={onDeleteClick}
              loading={isDeleting}
              className="t--apiFormDeleteBtn"
            />
            <ActionButton
              text="Run"
              accent="secondary"
              onClick={() => {
                onRunClick();
              }}
              loading={isRunning}
              className="t--apiFormRunBtn"
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
          <DropdownField
            placeholder="Method"
            name="actionConfiguration.httpMethod"
            options={HTTP_METHOD_OPTIONS}
          />
          <DatasourceWrapper className="t--dataSourceField">
            <DatasourcesField
              name="datasource.id"
              pluginId={pluginId}
              appName={props.appName}
            />
          </DatasourceWrapper>
          <DynamicTextField
            className="t--path"
            placeholder="v1/method"
            name="actionConfiguration.path"
            leftIcon={FormIcons.SLASH_ICON}
            normalize={value => value.trim()}
            singleLine
            setMaxHeight
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
                          actionConfiguration && actionConfigurationHeaders
                        }
                        placeholder="Value"
                        pushFields
                      />
                    </HeadersSection>
                    <KeyValueFieldArray
                      name="actionConfiguration.queryParameters"
                      label="Params"
                      pushFields
                    />
                    {allowPostBody && (
                      <PostBodyData
                        actionConfigurationHeaders={actionConfigurationHeaders}
                        actionConfiguration={actionConfigurationBody}
                        change={props.change}
                      />
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
  const httpMethodFromForm = selector(state, "actionConfiguration.httpMethod");
  const actionConfiguration = selector(state, "actionConfiguration");
  const actionConfigurationBody = selector(state, "actionConfiguration.body");
  const actionConfigurationHeaders = selector(
    state,
    "actionConfiguration.headers",
  );
  let contentType;
  if (actionConfigurationHeaders) {
    contentType = actionConfigurationHeaders.find(
      (header: any) => header.key === "content-type",
    );
  }

  return {
    httpMethodFromForm,
    actionConfiguration,
    actionConfigurationBody,
    contentType,
    actionConfigurationHeaders,
  };
})(
  reduxForm<RestAction, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
    destroyOnUnmount: false,
  })(ApiEditorForm),
);
