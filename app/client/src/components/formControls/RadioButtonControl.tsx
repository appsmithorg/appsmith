import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { Radio, RadioGroup, type SelectOptionProps } from "@appsmith/ads";
import styled from "styled-components";

class RadioButtonControl extends BaseControl<RadioButtonControlProps> {
  getControlType(): ControlType {
    return "RADIO_BUTTON";
  }
  render() {
    return (
      <Field
        component={renderComponent}
        name={this.props.configProperty}
        props={{ ...this.props }}
        type="radiobutton"
      />
    );
  }
}

type renderComponentProps = RadioButtonControlProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  options?: Array<{ label: string; value: string }>;
};

const StyledRadioGroup = styled(RadioGroup)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  marginTop: "16px",
});

function renderComponent(props: renderComponentProps) {
  const onChangeHandler = (value: string) => {
    if (typeof props.input?.onChange === "function") {
      props.input.onChange(value);
    }
  };

  const options = props.options || [];
  const defaultValue = props.initialValue as string;

  return (
    <StyledRadioGroup
      data-testid={props.input?.name}
      defaultValue={defaultValue}
      onChange={onChangeHandler}
    >
      {options.map((option) => {
        return (
          <Radio key={option.value} value={option.value}>
            {option.label}
          </Radio>
        );
      })}
    </StyledRadioGroup>
  );
}

export interface RadioButtonControlProps extends ControlProps {
  options: SelectOptionProps[];
}

export default RadioButtonControl;
