import React from "react";
import { Form, reduxForm, InjectedFormProps } from "redux-form";
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import {
  CreateApplicationFormValues,
  createApplicationFormSubmitHandler,
} from "./helpers";
import TextField from "components/editorComponents/form/fields/TextField";
import FormGroup from "components/editorComponents/form/FormGroup";

export const CreateApplicationForm = (
  props: InjectedFormProps<CreateApplicationFormValues>,
) => {
  const { error, handleSubmit } = props;
  return (
    <Form onSubmit={handleSubmit(createApplicationFormSubmitHandler)}>
      <FormGroup intent={error ? "danger" : "none"}>
        <TextField name="applicationName" placeholder="Name" />
      </FormGroup>
    </Form>
  );
};

export default reduxForm<CreateApplicationFormValues>({
  form: CREATE_APPLICATION_FORM_NAME,
  onSubmit: createApplicationFormSubmitHandler,
})(CreateApplicationForm);
