import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Switch } from "@appsmith/ads";
import type { ControlType } from "constants/PropertyControlConstants";
import type { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form";
import styled from "styled-components";

type SwitchFieldProps = WrappedFieldProps & {
  label: string;
  isRequired: boolean;
  info: string;
  disabled: boolean;
};

const SwitchWrapped = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: end;
  position: relative;
  max-width: 60vw;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SwitchField extends React.Component<SwitchFieldProps, any> {
  get value() {
    const { input } = this.props;
    if (typeof input.value !== "string") return !!input.value;
    else {
      if (input.value.toLocaleLowerCase() === "false") return false;
      else return !!input.value;
    }
  }

  render() {
    return (
      <SwitchWrapped data-testid={this.props.input.name}>
        {/* TODO: refactor so that the label of the field props is also passed down and a part of Switch.*/}
        <Switch
          className="switch-control"
          isDisabled={this.props.disabled}
          isSelected={this.value}
          name={this.props.input.name}
          onChange={(isSelected) => this.props.input.onChange(isSelected)}
        />
      </SwitchWrapped>
    );
  }
}

class SwitchControl extends BaseControl<SwitchControlProps> {
  render() {
    const { configProperty, disabled, info, isRequired, label } = this.props;

    return (
      <Field
        component={SwitchField}
        disabled={disabled}
        info={info}
        isRequired={isRequired}
        label={label}
        name={configProperty}
      />
    );
  }

  getControlType(): ControlType {
    return "SWITCH";
  }
}

export interface SwitchControlProps extends ControlProps {
  info?: string;
}

export default SwitchControl;
