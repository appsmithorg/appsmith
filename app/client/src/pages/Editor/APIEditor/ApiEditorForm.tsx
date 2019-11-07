import React from "react";
import { reduxForm, InjectedFormProps, FormSubmitHandler } from "redux-form";
import {
  FORM_INITIAL_VALUES,
  HTTP_METHOD_OPTIONS,
} from "../../../constants/ApiEditorConstants";
import styled from "styled-components";
import FormLabel from "../../../components/editorComponents/FormLabel";
import FormRow from "../../../components/editorComponents/FormRow";
import { BaseButton } from "../../../components/designSystems/blueprint/ButtonComponent";
import { RestAction } from "../../../api/ActionAPI";
import TextField from "../../../components/editorComponents/fields/TextField";
import DropdownField from "../../../components/editorComponents/fields/DropdownField";
import DatasourcesField from "../../../components/editorComponents/fields/DatasourcesField";
import KeyValueFieldArray from "../../../components/editorComponents/fields/KeyValueFieldArray";
import JSONEditorField from "../../../components/editorComponents/fields/JSONEditorField";
import { required } from "../../../utils/validation/common";
import { apiPathValidation } from "../../../utils/validation/ApiForm";
import ApiResponseView from "../../../components/editorComponents/ApiResponseView";
import { API_EDITOR_FORM_NAME } from "../../../constants/forms";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${props => props.theme.headerHeight});
  width: 100%;
  ${FormLabel} {
    padding: ${props => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    flex-wrap: wrap;
    padding: ${props => props.theme.spaces[3]}px;
    & > * {
      margin-right: 5px;
    }
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
  }
`;

const SecondaryWrapper = styled.div`
  display: flex;
  height: 100%;
  border-top: 1px solid #d0d7dd;
`;

const ForwardSlash = styled.div`
  && {
    margin: 0 10px;
    height: 27px;
    width: 1px;
    background-color: #d0d7dd;
    transform: rotate(27deg);
    align-self: center;
  }
`;

const RequestParamsWrapper = styled.div`
  flex: 5;
  border-right: 1px solid #d0d7dd;
  height: 100%;
  overflow-y: scroll;
`;

const ActionButtons = styled.div`
  flex: 1;
`;

const ActionButton = styled(BaseButton)`
  max-width: 72px;
  margin: 0 5px;
`;

const JSONEditorFieldWrapper = styled.div`
  margin: 5px;
  border: 1px solid #d0d7dd;
  border-radius: 4px;
`;

interface APIFormProps {
  onSubmit: FormSubmitHandler<RestAction>;
  onSaveClick: () => void;
  onRunClick: () => void;
  onDeleteClick: () => void;
  isSaving: boolean;
  isRunning: boolean;
  isDeleting: boolean;
}

type Props = APIFormProps & InjectedFormProps<RestAction, APIFormProps>;

const ApiEditorForm: React.FC<Props> = (props: Props) => {
  const {
    onSaveClick,
    onDeleteClick,
    onRunClick,
    handleSubmit,
    isDeleting,
    isRunning,
    isSaving,
  } = props;
  return (
    <Form onSubmit={handleSubmit}>
      <FormRow>
        <TextField
          name="name"
          placeholderMessage="API Name"
          validate={required}
        />
        <ActionButtons>
          <ActionButton
            text="Delete"
            styleName="error"
            onClick={onDeleteClick}
            loading={isDeleting}
          />
          <ActionButton
            text="Run"
            styleName="secondary"
            onClick={onRunClick}
            loading={isRunning}
          />
          <ActionButton
            text="Save"
            styleName="primary"
            filled
            onClick={onSaveClick}
            loading={isSaving}
          />
        </ActionButtons>
      </FormRow>
      <FormRow>
        <DropdownField
          placeholder="Method"
          name="actionConfiguration.httpMethod"
          options={HTTP_METHOD_OPTIONS}
        />
        <DatasourcesField name="datasourceId" />
        <ForwardSlash />
        <TextField
          placeholderMessage="API Path"
          name="actionConfiguration.path"
          validate={[required, apiPathValidation]}
        />
      </FormRow>
      <SecondaryWrapper>
        <RequestParamsWrapper>
          <KeyValueFieldArray
            name="actionConfiguration.headers"
            label="Headers"
          />
          <KeyValueFieldArray
            name="actionConfiguration.queryParameters"
            label="Params"
          />
          <FormLabel>{"Post Body"}</FormLabel>
          <JSONEditorFieldWrapper>
            <JSONEditorField name="actionConfiguration.body" />
          </JSONEditorFieldWrapper>
        </RequestParamsWrapper>
        <ApiResponseView />
      </SecondaryWrapper>
    </Form>
  );
};

export default reduxForm<RestAction, APIFormProps>({
  form: API_EDITOR_FORM_NAME,
  enableReinitialize: true,
  initialValues: FORM_INITIAL_VALUES,
})(ApiEditorForm);
