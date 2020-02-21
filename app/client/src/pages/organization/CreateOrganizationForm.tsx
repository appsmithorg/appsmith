import React from "react";
import { Form, reduxForm, InjectedFormProps } from "redux-form";
import { CREATE_ORGANIZATION_FORM_NAME } from "constants/forms";
import {
  CreateOrganizationFormValues,
  createOrganizationSubmitHandler,
} from "./helpers";
import TextField from "components/editorComponents/form/fields/TextField";
import FormGroup from "components/editorComponents/form/FormGroup";
import FormFooter from "components/editorComponents/form/FormFooter";
import FormMessage from "components/editorComponents/form/FormMessage";

// TODO(abhinav): abstract onCancel out.
export const CreateApplicationForm = (
  props: InjectedFormProps<
    CreateOrganizationFormValues,
    { onCancel: () => void }
  > & {
    onCancel: () => void;
  },
) => {
  const { error, handleSubmit, pristine, submitting } = props;
  return (
    <Form onSubmit={handleSubmit(createOrganizationSubmitHandler)}>
      {error && !pristine && <FormMessage intent="danger" message={error} />}
      <FormGroup intent={error ? "danger" : "none"} helperText={error}>
        <TextField name="name" placeholder="Name" />
      </FormGroup>
      <FormFooter
        onCancel={props.onCancel}
        divider
        submitOnEnter
        submitText="Submit"
        onSubmit={handleSubmit(createOrganizationSubmitHandler)}
        size="small"
        submitting={submitting && !error}
      />
    </Form>
  );
};

export default reduxForm<
  CreateOrganizationFormValues,
  { onCancel: () => void }
>({
  form: CREATE_ORGANIZATION_FORM_NAME,
})(CreateApplicationForm);
