import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { InputType } from "widgets/InputWidget";
import { ControlType } from "constants/PropertyControlConstants";
import TextField from "components/editorComponents/form/fields/TextField";
import FormLabel from "components/editorComponents/FormLabel";
import { FormIcons } from "icons/FormIcons";
import { Colors } from "constants/Colors";
import styled from "styled-components";

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
}) {
  const {
    name,
    placeholder,
    dataType,
    label,
    isRequired,
    disabled,
    subtitle,
    encrypted,
  } = props;

  return (
    <div style={{ width: "50vh" }} data-cy={name}>
      <FormLabel>
        {label} {isRequired && "*"}{" "}
        {encrypted && (
          <>
            <FormIcons.LOCK_ICON width={12} height={12} keepColors />
            <StyledInfo>Encrypted</StyledInfo>
          </>
        )}
        {subtitle && (
          <>
            <br />
            <StyledInfo>{subtitle}</StyledInfo>
          </>
        )}
      </FormLabel>
      <TextField
        name={name}
        placeholder={placeholder}
        type={dataType}
        disabled={disabled || false}
        showError
      />
    </div>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    const {
      validationMessage,
      propertyValue,
      isValid,
      label,
      placeholderText,
      dataType,
      configProperty,
      disabled,
      subtitle,
    } = this.props;

    return (
      <InputText
        name={configProperty}
        label={label}
        value={propertyValue}
        isValid={isValid}
        validationMessage={validationMessage}
        placeholder={placeholderText}
        dataType={this.getType(dataType)}
        encrypted={this.props.encrypted}
        disabled={disabled}
        subtitle={subtitle}
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
