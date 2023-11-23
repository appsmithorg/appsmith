import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import type { DetailsFormValues, SetupFormProps } from "./DetailsForm";
import DetailsForm from "./DetailsForm";
import {
  WELCOME_FORM_USECASE_FIELD_NAME,
  WELCOME_FORM_EMAIL_FIELD_NAME,
  WELCOME_FORM_NAME,
  WELCOME_FORM_NAME_FIELD_NAME,
  WELCOME_FORM_PASSWORD_FIELD_NAME,
  WELCOME_FORM_VERIFY_PASSWORD_FIELD_NAME,
  WELCOME_FORM_CUSTOM_USECASE_FIELD_NAME,
  WELCOME_FORM_ROLE_FIELD_NAME,
  WELCOME_FORM_ROLE_NAME_FIELD_NAME,
} from "@appsmith/constants/forms";
import type { FormErrors } from "redux-form";
import { formValueSelector, getFormSyncErrors, reduxForm } from "redux-form";
import { isEmail, isStrongPassword } from "utils/formhelpers";
import type { AppState } from "@appsmith/reducers";
import { SUPER_USER_SUBMIT_PATH } from "@appsmith/constants/ApiConstants";
import { useState } from "react";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import {
  WELCOME_FORM_CUSTOM_USE_CASE_ERROR_MESSAGE,
  WELCOME_FORM_USE_CASE_ERROR_MESSAGE,
  WELCOME_FORM_EMAIL_ERROR_MESSAGE,
  createMessage,
  WELCOME_FORM_STRONG_PASSWORD_ERROR_MESSAGE,
  WELCOME_FORM_GENERIC_ERROR_MESSAGE,
  WELCOME_FORM_PASSWORDS_NOT_MATCHING_ERROR_MESSAGE,
  WELCOME_FORM_ROLE_ERROR_MESSAGE,
} from "@appsmith/constants/messages";

const PageWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: start;
  overflow: auto;
  position: relative;
  z-index: 100;
`;

const SetupFormContainer = styled.div``;

const SetupStep = styled.div<{ active: boolean }>`
  display: ${(props) => (props.active ? "block" : "none")};
`;

const SpaceFiller = styled.div`
  height: 100px;
`;

export const firstpageValues = [
  "firstName",
  "lastName",
  "email",
  "password",
  "verifyPassword",
];

export const secondPageValues = [
  "role",
  "useCase",
  "custom_useCase",
  "role_name",
];

const validate = (values: DetailsFormValues) => {
  const errors: DetailsFormValues = {};
  if (!values.firstName) {
    errors.firstName = createMessage(WELCOME_FORM_GENERIC_ERROR_MESSAGE);
  }

  if (!values.email || !isEmail(values.email)) {
    errors.email = createMessage(WELCOME_FORM_EMAIL_ERROR_MESSAGE);
  }

  if (!values.password || !isStrongPassword(values.password)) {
    errors.password = createMessage(WELCOME_FORM_STRONG_PASSWORD_ERROR_MESSAGE);
  }

  if (!values.verifyPassword || values.password != values.verifyPassword) {
    errors.verifyPassword = createMessage(
      WELCOME_FORM_PASSWORDS_NOT_MATCHING_ERROR_MESSAGE,
    );
  }

  if (!values.role) {
    errors.role_name = createMessage(WELCOME_FORM_ROLE_ERROR_MESSAGE);
  }

  if (values.role == "other" && !values.role_name) {
    errors.role_name = createMessage(WELCOME_FORM_ROLE_ERROR_MESSAGE);
  }

  if (!values.useCase) {
    errors.useCase = createMessage(WELCOME_FORM_USE_CASE_ERROR_MESSAGE);
  }

  if (values.useCase === "other" && !values.custom_useCase)
    errors.custom_useCase = createMessage(
      WELCOME_FORM_CUSTOM_USE_CASE_ERROR_MESSAGE,
    );

  return errors;
};

function SetupForm(props: SetupFormProps) {
  const signupURL = `/api/v1/${SUPER_USER_SUBMIT_PATH}`;
  const [isFirstPage, setIsFirstPage] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const isAirgappedFlag = isAirgapped();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = () => {
    const form: HTMLFormElement = formRef.current as HTMLFormElement;
    const verifyPassword: HTMLInputElement = document.querySelector(
      `[name="verifyPassword"]`,
    ) as HTMLInputElement;
    if (verifyPassword) verifyPassword.removeAttribute("name");

    const firstName: HTMLInputElement = document.querySelector(
      `[name="firstName"]`,
    ) as HTMLInputElement;

    const lastName: HTMLInputElement = document.querySelector(
      `[name="lastName"]`,
    ) as HTMLInputElement;

    if (firstName && lastName) {
      const fullName = document.createElement("input");
      fullName.type = "text";
      fullName.name = "name";
      fullName.style.display = "none";
      fullName.value = `${firstName.value} ${lastName.value}`;
      form.appendChild(fullName);
    }

    const roleInput = document.createElement("input");
    roleInput.type = "text";
    roleInput.name = "role";
    roleInput.style.display = "none";
    if (props.role !== "other") {
      roleInput.value = props.role as string;
    } else {
      roleInput.value = props.role_name as string;
    }
    form.appendChild(roleInput);

    const useCaseInput = document.createElement("input");
    useCaseInput.type = "text";
    useCaseInput.name = "useCase";
    useCaseInput.style.display = "none";
    if (props.useCase !== "other") {
      useCaseInput.value = props.useCase as string;
    } else {
      useCaseInput.value = props.custom_useCase as string;
    }
    form.appendChild(useCaseInput);
    const anonymousDataInput = document.createElement("input");
    anonymousDataInput.type = "checkbox";
    anonymousDataInput.value = isAirgappedFlag ? "false" : "true";
    anonymousDataInput.checked = isAirgappedFlag ? false : true;
    anonymousDataInput.name = "allowCollectingAnonymousData";
    anonymousDataInput.style.display = "none";
    form.appendChild(anonymousDataInput);
    const signupForNewsletter: HTMLInputElement = document.querySelector(
      `[name="signupForNewsletter"]`,
    ) as HTMLInputElement;
    if (signupForNewsletter)
      signupForNewsletter.value = signupForNewsletter.checked.toString();
    form.submit();
    return true;
  };

  useEffect(() => {
    //add enter key event listener
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [props, isSubmitted]);

  const toggleFormPage = () => {
    setIsFirstPage(!isFirstPage);
  };

  const onKeyDown = (event: any) => {
    if (event.key === "Enter") {
      if (props.valid) {
        if (isFirstPage) {
          // If we are on the first page we do not want to submit the form
          // instead we move the user to the next page
          toggleFormPage();
        } else {
          // If we are on the second page we submit the form if not submitted already
          if (!isSubmitted) onSubmit();
          //if form is already submitted once do not submit it again
          setIsSubmitted(true);
        }
      } else {
        // The fields to be marked as touched so that we can display the errors
        const toTouch = [];
        // We fetch the fields which are invalid based on field name
        for (const key in props.formSyncErrors) {
          if (
            (isFirstPage && firstpageValues.includes(key)) ||
            (!isFirstPage && secondPageValues.includes(key))
          )
            props.formSyncErrors.hasOwnProperty(key) && toTouch.push(key);
        }
        props.touch(...toTouch);
      }
    }
  };

  return (
    <PageWrapper>
      <SetupFormContainer>
        <form
          action={signupURL}
          data-testid="super-user-form"
          id="super-user-form"
          method="POST"
          onSubmit={onSubmit}
          ref={formRef}
        >
          <SetupStep active>
            <DetailsForm
              {...props}
              isFirstPage={isFirstPage}
              toggleFormPage={toggleFormPage}
            />
          </SetupStep>
        </form>
        <SpaceFiller />
      </SetupFormContainer>
    </PageWrapper>
  );
}

const selector = formValueSelector(WELCOME_FORM_NAME);
export default connect((state: AppState) => {
  return {
    name: selector(state, WELCOME_FORM_NAME_FIELD_NAME),
    email: selector(state, WELCOME_FORM_EMAIL_FIELD_NAME),
    password: selector(state, WELCOME_FORM_PASSWORD_FIELD_NAME),
    verify_password: selector(state, WELCOME_FORM_VERIFY_PASSWORD_FIELD_NAME),
    role: selector(state, WELCOME_FORM_ROLE_FIELD_NAME),
    role_name: selector(state, WELCOME_FORM_ROLE_NAME_FIELD_NAME),
    useCase: selector(state, WELCOME_FORM_USECASE_FIELD_NAME),
    custom_useCase: selector(state, WELCOME_FORM_CUSTOM_USECASE_FIELD_NAME),
    formSyncErrors: getFormSyncErrors(WELCOME_FORM_NAME)(state),
  };
}, null)(
  reduxForm<DetailsFormValues, { formSyncErrors?: FormErrors<string, string> }>(
    {
      validate,
      form: WELCOME_FORM_NAME,
      touchOnBlur: true,
    },
  )(SetupForm),
);
