import React, { lazy, Suspense } from "react";
import styled from "styled-components";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import { InputType } from "widgets/InputWidget";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";
import CodeMirror from "codemirror";
const LightningMenu = lazy(() =>
  import("components/editorComponents/LightningMenu"),
);
const InputControlWrapper = styled.div`
  width: 100%;
  position: relative;
  & > span:first-of-type {
    position: absolute;
    right: 0;
    top: 2px;
    width: 14px;
    z-index: 10;
  }
`;

export function InputText(props: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  isValid: boolean;
  validationMessage?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  const {
    validationMessage,
    value,
    isValid,
    onChange,
    placeholder,
    defaultValue,
  } = props;
  return (
    <StyledDynamicInput>
      <DynamicAutocompleteInput
        input={{
          value: value,
          onChange: onChange,
        }}
        meta={{
          error: isValid ? "" : validationMessage,
          touched: true,
        }}
        theme={"DARK"}
        singleLine={false}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </StyledDynamicInput>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  state = {
    defaultValue: "",
  };
  updatePropertyValue = (value: string) => {
    this.setState({ defaultValue: value });
  };

  render() {
    const {
      validationMessage,
      propertyValue,
      isValid,
      label,
      placeholderText,
    } = this.props;
    return (
      <InputControlWrapper>
        <Suspense fallback={<div />}>
          <LightningMenu updatePropertyValue={this.updatePropertyValue} />
        </Suspense>
        <InputText
          label={label}
          value={propertyValue}
          onChange={this.onTextChange}
          isValid={isValid}
          validationMessage={validationMessage}
          placeholder={placeholderText}
          defaultValue={this.state.defaultValue}
        />
      </InputControlWrapper>
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

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = event;
    if (typeof event !== "string") {
      value = event.target.value;
    }
    this.updateProperty(this.props.propertyName, value);
  };

  static getControlType() {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType: InputType;
  isDisabled?: boolean;
}

export default InputTextControl;
