import React from "react";
import { connect } from "react-redux";
import { Form, reduxForm, InjectedFormProps, Field } from "redux-form";
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import { AppState } from "reducers";
import {
  CreateApplicationFormValues,
  createApplicationFormSubmitHandler,
} from "./helpers";
import TextField from "components/editorComponents/form/fields/TextField";
import FormGroup from "components/editorComponents/form/FormGroup";
import FormFooter from "components/editorComponents/form/FormFooter";
import FormMessage from "components/editorComponents/form/FormMessage";

type Props = InjectedFormProps<
  CreateApplicationFormValues,
  { onCancel: () => void; orgId: string; initialValues: {} }
> & {
  onCancel: () => void;
  orgId: string;
  initialValues: {};
};

// TODO(abhinav): abstract onCancel out.

export const CreateApplicationForm = (props: Props) => {
  const { error, handleSubmit, pristine, submitting, orgId } = props;
  return (
    <Form onSubmit={handleSubmit(createApplicationFormSubmitHandler)}>
      {error && !pristine && <FormMessage intent="danger" message={error} />}
      <FormGroup intent={error ? "danger" : "none"}>
        <TextField name="applicationName" placeholder="Name" />
        <Field type="hidden" name="orgId" component="input" />
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

const mapStateToProps = (state: AppState, props: Props): any => {
  const orgId = props.orgId;
  console.log(orgId, " orgId in mapStateToProps");
  return {
    initialValues: {
      orgId: props.orgId,
    },
  };
};

export default connect(mapStateToProps)(
  reduxForm<
    CreateApplicationFormValues,
    { onCancel: () => void; orgId: string; initialValues: {} }
  >({
    form: CREATE_APPLICATION_FORM_NAME,
    onSubmit: createApplicationFormSubmitHandler,
  })(CreateApplicationForm),
);
