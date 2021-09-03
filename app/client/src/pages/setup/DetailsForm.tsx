import React from "react";
import styled from "styled-components";
import {
  Field,
  InjectedFormProps,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import {
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  FormHeaderWrapper,
} from "./common";
import Dropdown from "components/ads/Dropdown";
import StyledFormGroup from "components/ads/formFields/FormGroup";
import { createMessage } from "constants/messages";
import FormTextField, {
  FormTextFieldProps,
} from "components/ads/formFields/TextField";
import { DetailsFormValues } from "./SetupForm";
import { ButtonWrapper } from "pages/Applications/ForkModalStyles";
import Button, { Category, Size } from "components/ads/Button";
import { OptionType, roleOptions, useCaseOptions } from "./constants";

const DetailsFormWrapper = styled.div`
  width: 100%;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[17] * 2}px;
  padding-right: ${(props) => props.theme.spaces[4]}px;
`;

const StyledFormBodyWrapper = styled(FormBodyWrapper)`
  width: 260px;
`;

const DropdownWrapper = styled(StyledFormGroup)`
  && {
    margin-bottom: 33px;
  }
  && .cs-text {
    width: 100%;
  }
`;

function withDropdown(options: OptionType[]) {
  return function Fieldropdown(
    ComponentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    function onSelect(value?: string) {
      ComponentProps.input.onChange && ComponentProps.input.onChange(value);
      ComponentProps.input.onBlur && ComponentProps.input.onBlur(value);
    }

    const selected =
      options.find((option) => option.value == ComponentProps.input.value) ||
      {};

    return (
      <Dropdown
        onSelect={onSelect}
        options={options}
        selected={selected}
        showLabelOnly
        width="260px"
      />
    );
  };
}

export default function DetailsForm(
  props: InjectedFormProps & DetailsFormValues & { onNext?: () => void },
) {
  const ref = React.createRef<HTMLDivElement>();

  return (
    <DetailsFormWrapper ref={ref}>
      <FormHeaderWrapper>
        <FormHeaderIndex>1.</FormHeaderIndex>
        <FormHeaderLabel>Let us get to know you better!</FormHeaderLabel>
      </FormHeaderWrapper>
      <StyledFormBodyWrapper>
        <StyledFormGroup label={createMessage(() => "FULL NAME")}>
          <FormTextField autoFocus name="name" placeholder="" type="text" />
        </StyledFormGroup>
        <StyledFormGroup label={createMessage(() => "EMAIL ID")}>
          <FormTextField name="email" placeholder="" type="email" />
        </StyledFormGroup>
        <StyledFormGroup label={createMessage(() => "CREATE PASSWORD")}>
          <FormTextField name="password" placeholder="" type="password" />
        </StyledFormGroup>
        <StyledFormGroup label={createMessage(() => "VERIFY PASSWORD")}>
          <FormTextField name="verifyPassword" placeholder="" type="password" />
        </StyledFormGroup>
        <DropdownWrapper label={createMessage(() => "WHAT ROLE DO YOU PLAY?")}>
          <Field
            asyncControl
            component={withDropdown(roleOptions)}
            name="role"
            placeholder=""
            type="text"
          />
        </DropdownWrapper>
        {props.role == "other" && (
          <StyledFormGroup label={createMessage(() => "ROLE")}>
            <FormTextField name="role_name" placeholder="" type="text" />
          </StyledFormGroup>
        )}
        <DropdownWrapper
          label={createMessage(() => "Tell us about your use case")}
        >
          <Field
            asyncControl
            component={withDropdown(useCaseOptions)}
            name="useCase"
            placeholder=""
            type="text"
          />
        </DropdownWrapper>
        <ButtonWrapper>
          <Button
            category={Category.tertiary}
            disabled={props.invalid}
            onClick={props.onNext}
            size={Size.medium}
            tag="button"
            text="Next"
            type="button"
          />
        </ButtonWrapper>
      </StyledFormBodyWrapper>
    </DetailsFormWrapper>
  );
}
