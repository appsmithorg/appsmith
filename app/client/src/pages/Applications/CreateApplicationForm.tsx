import React from "react";
import { Form, reduxForm, InjectedFormProps } from "redux-form";
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import {
  CreateApplicationFormValues,
  createApplicationFormSubmitHandler,
} from "./helpers";
import TextField from "components/editorComponents/form/fields/TextField";
import FormGroup from "components/editorComponents/form/FormGroup";
import FormFooter from "components/editorComponents/form/FormFooter";
import FormMessage from "components/editorComponents/form/FormMessage";

// TODO(abhinav): abstract onCancel out.
export const CreateApplicationForm = (
  props: InjectedFormProps<
    CreateApplicationFormValues,
    { onCancel: () => void }
  > & {
    onCancel: () => void;
  },
) => {
  const { error, handleSubmit, pristine, submitting } = props;
  return (
    <Form onSubmit={handleSubmit(createApplicationFormSubmitHandler)}>
      {error && !pristine && <FormMessage intent="danger" message={error} />}
      <FormGroup intent={error ? "danger" : "none"} helperText={error}>
        <TextField name="applicationName" placeholder="Name" />
      </FormGroup>
      <FormFooter
        onCancel={props.onCancel}
        onSubmit={handleSubmit(createApplicationFormSubmitHandler)}
        divider
        submitOnEnter
        submitText="Submit"
        size="small"
        submitting={submitting && !error}
      />
    </Form>
  );
};

export default reduxForm<CreateApplicationFormValues, { onCancel: () => void }>(
  {
    form: CREATE_APPLICATION_FORM_NAME,
    onSubmit: createApplicationFormSubmitHandler,
  },
)(CreateApplicationForm);
