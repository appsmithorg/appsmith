import React from "react";
import { Form, reduxForm, InjectedFormProps } from "redux-form";
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import {
  CreateApplicationFormValues,
  createApplicationFormSubmitHandler,
} from "utils/formhelpers";
import TextField from "components/editorComponents/form/fields/TextField";
import { required } from "utils/validation/common";
import { FormGroup } from "@blueprintjs/core";

export const CreateApplicationForm = (
  props: InjectedFormProps<CreateApplicationFormValues>,
) => {
  const { error, handleSubmit } = props;
  return (
    <Form onSubmit={handleSubmit(createApplicationFormSubmitHandler)}>
      <FormGroup intent={error ? "danger" : "none"} helperText={error}>
        <TextField
          name="applicationName"
          placeholder="Name"
          validate={required}
        />
      </FormGroup>
    </Form>
  );
};

export default reduxForm<CreateApplicationFormValues>({
  form: CREATE_APPLICATION_FORM_NAME,
  onSubmit: createApplicationFormSubmitHandler,
})(CreateApplicationForm);
