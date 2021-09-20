import React from "react";
import styled from "styled-components";
import {
  Field,
  BaseFieldProps,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import { Colors } from "constants/Colors";
import { ControlProps } from "components/formControls/BaseControl";

//Styled help text, intended to be used with Form Fields
export const StyledFormInfo = styled.span`
  font-weight: normal;
  line-height: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: 1px;
`;

//Styled help text, intended to be used with Form Fields
const FormInputHelperText = styled.p`
  color: #858282;
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  margin: 0px;
`;

//Styled error text, intended to be used with Form Fields
const FormInputErrorText = styled.p`
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  color: #f22b2b;
  margin: 8px 0 0 0;
`;

//Styled anchor tag, intended to be used with Form Fields
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

//Styled form label tag, intended to be used with Form Fields
const StyledFormLabel = styled.label<{ config?: ControlProps }>`
  display: inline-block;
  font-weight: 500;
  // TODO: replace condition with props.config?.dataType === "TOGGLE" 
  min-width: ${(props) =>
    props.config?.controlType === "SWITCH" ||
    props.config?.controlType === "CHECKBOX"
      ? "auto;"
      : "50vh;"} 
  font-size: 14px;
  line-height: 19px;
  letter-spacing: 0.02em;
  color: #4b4848;
  margin: 0 0px 8px 16px;
  &:first-child {
    margin-left: 0px;
  }
  p {
    display: flex;
  }
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

//Styled input tag
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

//required by Field component in Form Fields
const renderComponent = (
  componentProps: FormInputProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  //Add error class when showError is enabled and there is error in field
  const isError = componentProps.showError && componentProps.meta.error;
  return (
    <FormInput
      autoFocus={componentProps.autoFocus}
      className={isError ? "error" : ""}
      {...componentProps.input}
      disabled={componentProps.disabled}
      name={componentProps.name}
      placeholder={componentProps.placeholder}
      type={componentProps.type || "text"}
      value={componentProps.input.value}
    />
  );
};

export interface FormInputProps extends BaseFieldProps {
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder: string | undefined;
  type?: string | undefined;
  value?: string;
  className?: string;
  showError?: boolean;
}

//wrapper on styled <input />
function FormInput(props: FormInputProps) {
  return (
    <StyledInput
      autoFocus={props.autoFocus}
      disabled={props.disabled}
      onChange={props.onChange}
      placeholder={props.placeholder}
      {...props}
      type={props.type}
      value={props.value}
    />
  );
}

interface FormLabelProps {
  config?: ControlProps;
  children: JSX.Element | React.ReactNode;
}

//Wrapper on styled <label/>
function FormLabel(props: FormLabelProps) {
  return (
    <StyledFormLabel config={props.config}>{props.children}</StyledFormLabel>
  );
}

//Wrapper on styled <span/>
function FormInfoText(props: FormLabelProps) {
  return <StyledFormInfo>{props.children}</StyledFormInfo>;
}

export {
  FormLabel,
  FormInputAnchor,
  FormInputErrorText,
  FormInputHelperText,
  FormInfoText,
};
