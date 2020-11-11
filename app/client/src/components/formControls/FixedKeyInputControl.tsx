import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { InputType } from "widgets/InputWidget";
import { ControlType } from "constants/PropertyControlConstants";
import TextField from "components/editorComponents/form/fields/TextField";
import FormLabel from "components/editorComponents/FormLabel";
import styled from "styled-components";
import { AppState } from "reducers";
import { getFormValues } from "redux-form";
import { isHidden } from "./utils";
import { connect } from "react-redux";

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
      hidden,
    } = this.props;

    if (hidden) {
      return null;
    }

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
          format={value => {
            // Get the value property
            if (value) {
              return value.value;
            }

            return "";
          }}
          parse={value => {
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

const mapStateToProps = (
  state: AppState,
  ownProps: FixedKeyInputControlProps,
) => {
  const values = getFormValues(ownProps.formName)(state);
  const hidden = isHidden(values, ownProps.hidden);

  return {
    hidden,
  };
};

export interface FixedKeyInputControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  dataType?: InputType;
  fixedKey: string;
}

export default connect(mapStateToProps)(FixKeyInputControl);
