import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import TextInput from "components/ads/TextInput";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { InputType } from "components/constants";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";

export const StyledInfo = styled.span`
  font-weight: normal;
  line-height: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: 1px;
`;

export function InputText(props: {
  label: string;
  value: string;
  isValid: boolean;
  subtitle?: string;
  validationMessage?: string;
  placeholder?: string;
  dataType?: string;
  isRequired?: boolean;
  name: string;
  encrypted?: boolean;
  disabled?: boolean;
  customStyles?: Record<string, any>;
}) {
  const { dataType, disabled, name, placeholder } = props;

  return (
    <div data-cy={name} style={{ width: "35vw", ...props.customStyles }}>
      <Field
        component={renderComponent}
        datatype={dataType}
        disabled={disabled || false}
        placeholder={placeholder}
        {...props}
        asyncControl
      />
    </div>
  );
}

function renderComponent(
  props: {
    placeholder: string;
    dataType?: InputType;
    disabled?: boolean;
  } & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) {
  return (
    <TextInput
      dataType={props.dataType}
      disabled={props.disabled || false}
      name={props.input?.name}
      onChange={props.input.onChange}
      placeholder={props.placeholder}
      value={props.input.value}
      {...props.input}
      width="100%"
    />
  );
}
class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    const {
      configProperty,
      dataType,
      disabled,
      encrypted,
      isValid,
      label,
      placeholderText,
      propertyValue,
      subtitle,
      validationMessage,
    } = this.props;

    return (
      <InputText
        dataType={this.getType(dataType)}
        disabled={disabled}
        encrypted={encrypted}
        isValid={isValid}
        label={label}
        name={configProperty}
        placeholder={placeholderText}
        subtitle={subtitle}
        validationMessage={validationMessage}
        value={propertyValue}
      />
    );
  }

  isNumberType(): boolean {
    const { inputType } = this.props;
    switch (inputType) {
      case "CURRENCY":
      case "INTEGER":
      case "NUMBER":
      case "PHONE_NUMBER":
        return true;
      default:
        return false;
    }
  }

  getType(dataType: InputType | undefined) {
    switch (dataType) {
      case "PASSWORD":
        return "password";
      case "NUMBER":
        return "number";
      default:
        return "text";
    }
  }

  getControlType(): ControlType {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  dataType?: InputType;
  subtitle?: string;
  encrypted?: boolean;
  disabled?: boolean;
}

export default InputTextControl;
