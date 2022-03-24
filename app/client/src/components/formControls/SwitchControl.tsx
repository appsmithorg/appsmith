import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import Toggle from "components/ads/Toggle";
import { ControlType } from "constants/PropertyControlConstants";
import { Field, WrappedFieldProps } from "redux-form";
import styled from "styled-components";

type SwitchFieldProps = WrappedFieldProps & {
  label: string;
  isRequired: boolean;
  info: string;
  disabled: boolean;
};

const StyledToggle = styled(Toggle)`
  .slider {
    margin-left: 10px;
    width: 40px;
    height: 20px;
  }
  .slider::before {
    height: 16px;
    width: 16px;
  }
  input:checked + .slider::before {
    transform: translateX(19px);
  }
`;

const SwitchWrapped = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  .bp3-control {
    margin-bottom: 0px;
  }
  max-width: 60vw;
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

  render() {
    return (
      <div>
        <SwitchWrapped data-cy={this.props.input.name}>
          <StyledToggle
            className="switch-control"
            disabled={this.props.disabled}
            name={this.props.input.name}
            onToggle={(value: any) => {
              this.props.input.onChange(value);
            }}
            value={this.value}
          />
        </SwitchWrapped>
      </div>
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
