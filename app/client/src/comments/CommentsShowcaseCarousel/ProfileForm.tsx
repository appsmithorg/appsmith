import React from "react";

import { reduxForm } from "redux-form";

import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";

import UserProfileImagePicker from "components/ads/UserProfileImagePicker";

import {
  createMessage,
  DISPLAY_NAME,
  EMAIL_ADDRESS,
} from "@appsmith/constants/messages";
import styled from "styled-components";

import { isEmail, isEmptyString } from "utils/formhelpers";

export type FormValues = {
  fullName?: string;
  displayName?: string;
  emailAddress?: string;
};

const Container = styled.div`
  padding: ${(props) => props.theme.spaces[5]}px;
`;

export const PROFILE_FORM = "PROFILE_FORM";

export const fieldNames = {
  displayName: "displayName",
  emailAddress: "emailAddress",
};

const validate = (values: any) => {
  const errors: any = {};
  const displayName = values[fieldNames.displayName] || "";
  const emailAddress = values[fieldNames.emailAddress] || "";

  if (!displayName || isEmptyString(displayName)) {
    errors[fieldNames.displayName] = "Required";
  }
  if (!emailAddress || isEmptyString(emailAddress) || !isEmail(emailAddress)) {
    errors[fieldNames.emailAddress] = "Required";
  }

  return errors;
};

function ProfileForm(props: any) {
  return (
    <Container>
      <div style={{ marginBottom: 10 }}>
        <UserProfileImagePicker />
      </div>
      <FormGroup label={createMessage(DISPLAY_NAME)}>
        <FormTextField
          autoFocus
          hideErrorMessage
          name={fieldNames.displayName}
          placeholder=""
        />
      </FormGroup>
      <FormGroup label={createMessage(EMAIL_ADDRESS)}>
        <FormTextField
          disabled={props.emailDisabled}
          hideErrorMessage
          name={fieldNames.emailAddress}
          placeholder={createMessage(EMAIL_ADDRESS)}
          type="email"
        />
      </FormGroup>
    </Container>
  );
}

export default reduxForm({
  // Currently while using this feature,
  // a destroy action is dispatched
  // so the initial values don't get set
  // TODO: triage this issue
  destroyOnUnmount: false,
  form: PROFILE_FORM,
  validate,
})(ProfileForm);
