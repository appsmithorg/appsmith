import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { InputType } from "components/constants";
import { ControlType } from "constants/PropertyControlConstants";
import TextField from "components/editorComponents/form/fields/TextField";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 35vw;
`;

class FixKeyInputControl extends BaseControl<FixedKeyInputControlProps> {
  render() {
    const {
      configProperty,
      dataType,
      disabled,
      fixedKey,
      placeholderText,
    } = this.props;

    return (
      <Wrapper>
        <TextField
          disabled={disabled}
          format={(value) => {
            // Get the value property
            if (value) {
              return value.value;
            }

            return "";
          }}
          name={configProperty}
          parse={(value) => {
            // Store the value in this field as {key: fixedKey, value: <user-input>}
            return {
              key: fixedKey,
              value: value,
            };
          }}
          placeholder={placeholderText}
          showError
          type={this.getType(dataType)}
        />
      </Wrapper>
    );
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
    return "FIXED_KEY_INPUT";
  }
}

export interface FixedKeyInputControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  dataType?: InputType;
  fixedKey: string;
}

export default FixKeyInputControl;
