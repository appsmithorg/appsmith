import React from "react";

import { reduxForm } from "redux-form";

import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";

import FormDisplayImage from "./FormDisplayImage";

import {
  createMessage,
  FULL_NAME,
  DISPLAY_NAME,
  EMAIL_ADDRESS,
  FIRST_AND_LAST_NAME,
} from "constants/messages";
import styled from "styled-components";

import { isEmail, isEmptyString } from "utils/formhelpers";

export type FormValues = {
  fullName?: string;
  displayName?: string;
  emailAddress?: string;
};

// InjectedFormProps
// type Props = InjectedFormProps<FormValues>;

const Container = styled.div`
  padding: ${(props) => props.theme.spaces[5]}px;
`;

export const PROFILE_FORM = "PROFILE_FORM";

const fieldNames = {
  fullName: "fullName",
  displayName: "displayName",
  emailAddress: "emailAddress",
};

const validate = (values: any) => {
  const errors: any = {};
  const fullName = values[fieldNames.fullName] || "";
  const displayName = values[fieldNames.displayName] || "";
  const emailAddress = values[fieldNames.emailAddress] || "";

  if (!fullName || isEmptyString(fullName)) {
    errors[fieldNames.fullName] = "Required";
  }
  if (!displayName || isEmptyString(displayName)) {
    errors[fieldNames.displayName] = "Required";
  }
  if (!emailAddress || isEmptyString(emailAddress) || !isEmail(emailAddress)) {
    errors[fieldNames.emailAddress] = "Required";
  }

  return errors;
};

function ProfileForm() {
  return (
    <Container>
      <div style={{ marginBottom: 10 }}>
        <FormDisplayImage />
      </div>
      <FormGroup
        // intent={error ? "danger" : "none"}
        label={createMessage(FULL_NAME)}
      >
        <FormTextField
          autoFocus
          hideErrorMessage
          name={fieldNames.fullName}
          placeholder={createMessage(FIRST_AND_LAST_NAME)}
          // type="email"
        />
      </FormGroup>
      <FormGroup
        // intent={error ? "danger" : "none"}
        label={createMessage(DISPLAY_NAME)}
      >
        <FormTextField
          hideErrorMessage
          name={fieldNames.displayName}
          placeholder={createMessage(DISPLAY_NAME)}
          // type="email"
        />
      </FormGroup>
      <FormGroup
        // intent={error ? "danger" : "none"}
        label={createMessage(EMAIL_ADDRESS)}
      >
        <FormTextField
          hideErrorMessage
          name={fieldNames.emailAddress}
          placeholder={createMessage(EMAIL_ADDRESS)}
          // type="email"
        />
      </FormGroup>
    </Container>
  );
}

export default reduxForm({ form: PROFILE_FORM, validate })(ProfileForm);
