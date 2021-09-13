import React from "react";
import styled from "styled-components";
import {
  Field,
  BaseFieldProps,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import { TextInputProps } from "components/designSystems/appsmith/TextInputComponent";

const FormInputHelperText = styled.p`
  color: #858282;
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  margin: 8px 0 0 0;
`;

const FormInputErrorText = styled.p`
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  color: #f22b2b;
  margin: 8px 0 0 0;
`;

const FormInputAnchor = styled.a`
  display: block;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #6a86ce;
  margin: 0 0 8px 0;
  text-transform: uppercase;
`;

const StyledFormLabel = styled.label`
  display: block;
  font-weight: 500;
  font-size: 14px;
  line-height: 19px;
  letter-spacing: 0.02em;
  color: #4b4848;
  margin: 0 0 8px 0;
  .label-icon-wrapper {
    margin-bottom: 0px;
  }
  .label-icon-wrapper svg {
    position: relative;
    top: 3px;
  }
  .label-icon-wrapper svg path {
    fill: #939090;
  }
`;

const StyledInput = styled.input`
  padding: 8px 12px 9px;
  background-color: #fff;
  width: 100%;
  border: 1.2px solid #e0dede;
  height: 36px;
  margin: 0px;
  &.error {
    background-color: #ffe9e9;
    color: #f22b2b;
    border-color: #f22b2b;
  }
  &:disabled {
    background-color: #f0f0f0;
    color: #716e6e;
    border-color: #f0f0f0;
  }
`;

const renderComponent = (
  componentProps: FormInputProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;
  return (
    <>
      <FormInput
        autoFocus={componentProps.autoFocus}
        className={showError ? "error" : ""}
        {...componentProps.input}
        disabled={componentProps.disabled}
        name={componentProps.name}
        placeholder={componentProps.placeholder}
        type={componentProps.type || "text"}
        value={componentProps.input.value}
      />
      {showError ? (
        <FormInputErrorText>{componentProps.meta.error}</FormInputErrorText>
      ) : null}
    </>
  );
};

type K = BaseFieldProps & TextInputProps;

export interface FormInputProps extends K {
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder: string | undefined;
  type: string | undefined;
  url?: string;
  value: string;
}

function FormInput(props: FormInputProps) {
  return (
    <StyledInput
      autoFocus={props.autoFocus}
      disabled={props.disabled}
      onChange={props.onChange}
      placeholder={props.placeholder}
      type={props.type}
      value={props.value}
    />
  );
}

interface FormLabelProps {
  children: JSX.Element | React.ReactNode;
}

function FormLabel(props: FormLabelProps) {
  return <StyledFormLabel>{props.children}</StyledFormLabel>;
}

function FormInputField(props: FormInputProps) {
  return (
    <Field
      asyncControl
      component={renderComponent}
      disabled={props.disabled}
      {...props}
      noValidate
      type={props.type || "text"}
    />
  );
}

export {
  FormInputField,
  FormLabel,
  FormInputAnchor,
  FormInputErrorText,
  FormInputHelperText,
};
