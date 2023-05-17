import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Switch } from "design-system-old";
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
  position: relative;
  .bp3-control {
    margin-bottom: 0px;
  }
  max-width: 60vw;
  && .bp3-control.bp3-switch .bp3-control-indicator {
    width: 40px;
    height: 20px;
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    margin-left: 10px;
  }
  .bp3-control.bp3-switch .bp3-control-indicator::before {
    width: 16px;
    height: 16px;
  }
  .bp3-control.bp3-switch input:checked ~ .bp3-control-indicator::before {
    left: calc(100% - 20px);
  }
`;

export class SwitchField extends React.Component<SwitchFieldProps, any> {
  get value() {
    const { input } = this.props;
    if (typeof input.value !== "string") return !!input.value;
    else {
      if (input.value.toLocaleLowerCase() === "false") return false;
      else return !!input.value;
    }
  }

  onChange: React.FormEventHandler<HTMLInputElement> = () => {
    this.props.input.onChange(!this.value);
  };

  render() {
    return (
      <SwitchWrapped data-cy={this.props.input.name}>
        <Switch
          checked={this.value}
          className="switch-control"
          disabled={this.props.disabled}
          large
          name={this.props.input.name}
          onChange={this.onChange}
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
