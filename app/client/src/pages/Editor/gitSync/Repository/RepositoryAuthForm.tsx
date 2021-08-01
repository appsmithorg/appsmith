import React from "react";

import { reduxForm } from "redux-form";

import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";

import { createMessage, PASSWORD, USERNAME } from "constants/messages";
import styled from "styled-components";

import { isEmptyString } from "utils/formhelpers";

export type FormValues = {
  fullName?: string;
  username?: string;
  password?: string;
};

const Container = styled.div`
  margin-top: ${(props) => props.theme.spaces[6]}px;
`;

export const REPO_AUTH_FORM = "REPO_AUTH_FORM";

const fieldNames = {
  username: "username",
  password: "password",
};

const validate = (values: any) => {
  const errors: any = {};
  const username = values[fieldNames.username] || "";
  const password = values[fieldNames.password] || "";

  if (!username || isEmptyString(username)) {
    errors[fieldNames.username] = "Required";
  }
  if (!password || isEmptyString(password)) {
    errors[fieldNames.password] = "Required";
  }

  return errors;
};

function RepoAuthForm() {
  return (
    <Container>
      <FormGroup>
        <FormTextField
          autoFocus
          hideErrorMessage
          name={fieldNames.username}
          placeholder={createMessage(USERNAME)}
        />
      </FormGroup>
      <FormGroup>
        <FormTextField
          hideErrorMessage
          name={fieldNames.password}
          placeholder={createMessage(PASSWORD)}
          type="password"
        />
      </FormGroup>
    </Container>
  );
}

export default reduxForm({
  form: REPO_AUTH_FORM,
  validate,
})(RepoAuthForm);
