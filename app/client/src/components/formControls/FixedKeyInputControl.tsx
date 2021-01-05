import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { InputType } from "widgets/InputWidget";
import { ControlType } from "constants/PropertyControlConstants";
import TextField from "components/editorComponents/form/fields/TextField";
import FormLabel from "components/editorComponents/FormLabel";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 50vh;
`;

class FixKeyInputControl extends BaseControl<FixedKeyInputControlProps> {
  render() {
    const {
      label,
      placeholderText,
      dataType,
      configProperty,
      isRequired,
      fixedKey,
    } = this.props;

    return (
      <Wrapper>
        <FormLabel>
          {label} {isRequired && "*"}
        </FormLabel>
        <TextField
          name={configProperty}
          placeholder={placeholderText}
          type={this.getType(dataType)}
          showError
          format={(value) => {
            // Get the value property
            if (value) {
              return value.value;
            }

            return "";
          }}
          parse={(value) => {
            // Store the value in this field as {key: fixedKey, value: <user-input>}
            return {
              key: fixedKey,
              value: value,
            };
          }}
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
