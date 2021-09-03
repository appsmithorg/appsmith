import React, { memo } from "react";
import styled from "styled-components";
import {
  Field,
  InjectedFormProps,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import { useState } from "react";
import {
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  FormHeaderWrapper,
  StyledButton,
} from "./common";
import Dropdown from "components/ads/Dropdown";
import StyledFormGroup from "components/ads/formFields/FormGroup";
import { createMessage } from "constants/messages";
import FormTextField, {
  FormTextFieldProps,
} from "components/ads/formFields/TextField";
import { DetailsFormValues } from "./SetupForm";
import { ButtonWrapper } from "pages/Applications/ForkModalStyles";
import { Category, Size } from "components/ads/Button";

const DetailsFormWrapper = styled.div`
  width: 100%;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[17] * 2}px;
  padding-right: ${(props) => props.theme.spaces[4]}px;
`;

const StyledFormBodyWrapper = styled(FormBodyWrapper)`
  width: 260px;
`;

const RoleDropdownWrapper = styled(StyledFormGroup)`
  && {
    margin-bottom: 33px;
  }
  && .cs-text {
    width: 100%;
  }
`;

function Fieldropdown(
  ComponentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) {
  function onSelect(value?: string, option: options = {}) {
    ComponentProps.input.onChange && ComponentProps.input.onChange(value);
    ComponentProps.input.onBlur && ComponentProps.input.onBlur(value);
    setSelected(option);
  }

  const [selected, setSelected] = useState<options>({});

  return (
    <Dropdown
      onSelect={onSelect}
      options={roleOptions}
      selected={selected}
      showLabelOnly
      width="260px"
    />
  );
}

export default memo(function DetailsForm(
  props: InjectedFormProps & DetailsFormValues,
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
        <RoleDropdownWrapper
          label={createMessage(() => "WHAT ROLE DO YOU PLAY?")}
        >
          <Field
            asyncControl
            component={Fieldropdown}
            name="role"
            placeholder=""
            type="text"
          />
        </RoleDropdownWrapper>
        {props.role == "other" && (
          <StyledFormGroup label={createMessage(() => "ROLE")}>
            <FormTextField name="role_name" placeholder="" type="text" />
          </StyledFormGroup>
        )}
        <StyledFormGroup label={createMessage(() => "COMPANY NAME(OPTIONAL)")}>
          <FormTextField name="companyName" placeholder="" type="text" />
        </StyledFormGroup>
        <ButtonWrapper>
          <StyledButton
            category={Category.tertiary}
            disabled={props.invalid}
            size={Size.medium}
            tag="button"
            text="Next"
            type="button"
          />
        </ButtonWrapper>
      </StyledFormBodyWrapper>
    </DetailsFormWrapper>
  );
});

type options = {
  label?: string;
  value?: string;
};

const roleOptions: options[] = [
  {
    label: "Engineer",
    value: "engineer",
  },
  {
    label: "Product manager",
    value: "product manager",
  },
  {
    label: "Founder",
    value: "founder",
  },
  {
    label: "Operations",
    value: "operations",
  },
  {
    label: "Business Analyst",
    value: "business analyst",
  },
  {
    label: "Other",
    value: "other",
  },
];
