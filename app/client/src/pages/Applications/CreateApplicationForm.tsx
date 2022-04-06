import React from "react";
import { connect } from "react-redux";
import { Form, reduxForm, InjectedFormProps, Field } from "redux-form";
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import {
  createMessage,
  ERROR_MESSAGE_NAME_EMPTY,
  NAME_SPACE_ERROR,
} from "@appsmith/constants/messages";
import { AppState } from "reducers";
import {
  CreateApplicationFormValues,
  createApplicationFormSubmitHandler,
  CREATE_APPLICATION_FORM_NAME_FIELD,
} from "./helpers";
import TextField from "components/editorComponents/form/fields/TextField";
import FormGroup from "components/editorComponents/form/FormGroup";
import FormFooter from "components/editorComponents/form/FormFooter";
import FormMessage from "components/editorComponents/form/FormMessage";

type Props = InjectedFormProps<
  CreateApplicationFormValues,
  {
    onCancel: () => void;
    orgId: string;
    initialValues: Record<string, unknown>;
  }
> & {
  onCancel: () => void;
  orgId: string;
  initialValues: Record<string, unknown>;
};

const validate = (values: CreateApplicationFormValues) => {
  if (!values[CREATE_APPLICATION_FORM_NAME_FIELD]) {
    return {
      [CREATE_APPLICATION_FORM_NAME_FIELD]: createMessage(
        ERROR_MESSAGE_NAME_EMPTY,
      ),
    };
  } else if (!values[CREATE_APPLICATION_FORM_NAME_FIELD].trim()) {
    return {
      [CREATE_APPLICATION_FORM_NAME_FIELD]: createMessage(NAME_SPACE_ERROR),
    };
  }
  return {};
};

// TODO(abhinav): abstract onCancel out.

function CreateApplicationForm(props: Props) {
  const { error, handleSubmit, invalid, pristine, submitting } = props;
  return (
    <Form onSubmit={handleSubmit(createApplicationFormSubmitHandler)}>
      {error && !pristine && <FormMessage intent="danger" message={error} />}
      <FormGroup intent={error ? "danger" : "none"}>
        <TextField
          name={CREATE_APPLICATION_FORM_NAME_FIELD}
          placeholder="Name"
        />
        <Field component="input" name="orgId" type="hidden" />
      </FormGroup>
      <FormFooter
        canSubmit={!invalid}
        data-cy="t--create-app-submit"
        divider
        onCancel={props.onCancel}
        onSubmit={handleSubmit(createApplicationFormSubmitHandler)}
        size="small"
        submitOnEnter
        submitText="Submit"
        submitting={submitting && !error}
      />
    </Form>
  );
}

const mapStateToProps = (state: AppState, props: Props): any => {
  const orgId = props.orgId;
  return {
    initialValues: { orgId },
  };
};

export default connect(mapStateToProps)(
  reduxForm<
    CreateApplicationFormValues,
    {
      onCancel: () => void;
      orgId: string;
      initialValues: Record<string, unknown>;
    }
  >({
    validate,
    form: CREATE_APPLICATION_FORM_NAME,
    onSubmit: createApplicationFormSubmitHandler,
  })(CreateApplicationForm),
);
