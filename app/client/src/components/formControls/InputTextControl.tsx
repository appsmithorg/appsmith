import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { InputType } from "components/constants";
import { ControlType } from "constants/PropertyControlConstants";
import {
  FormInputField,
  FormLabel,
  FormInputHelperText,
  FormInputAnchor,
} from "components/editorComponents/form/fields/FormInputField";
import { FormIcons } from "icons/FormIcons";
import { Colors } from "constants/Colors";
import { ReactComponent as Help } from "assets/icons/control/help.svg";
import styled from "styled-components";

export const StyledInfo = styled.span`
  font-weight: normal;
  line-height: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: 1px;
`;

export function InputText(props: {
  description?: string;
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
  showIcon?: boolean;
  url?: string;
  urlText?: string;
}) {
  const {
    dataType,
    description,
    disabled,
    encrypted,
    isRequired,
    label,
    name,
    placeholder,
    subtitle,
    url,
    urlText,
    value,
  } = props;

  return (
    <div data-cy={name} style={{ width: "50vh" }}>
      <FormLabel>
        <p className="label-icon-wrapper">
          {label} {isRequired && "*"}{" "}
          {encrypted && (
            <>
              <FormIcons.LOCK_ICON height={12} keepColors width={12} />
              <StyledInfo>Encrypted</StyledInfo>
            </>
          )}
          <Help height={16} width={16} />
        </p>
        {subtitle && <StyledInfo>{subtitle}</StyledInfo>}
      </FormLabel>
      {urlText && (
        <FormInputAnchor href={url} target="_blank">
          {urlText}
        </FormInputAnchor>
      )}
      <FormInputField
        disabled={disabled}
        name={name}
        placeholder={placeholder}
        showError
        type={dataType}
        value={value}
      />
      {description && <FormInputHelperText>{description}</FormInputHelperText>}
    </div>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    const {
      configProperty,
      dataType,
      disabled,
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
        encrypted={this.props.encrypted}
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
