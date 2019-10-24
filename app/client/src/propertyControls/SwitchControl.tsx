import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "../constants/PropertyControlConstants";
import { ControlWrapper, StyledSwitch } from "./StyledControls";

class SwitchControl extends BaseControl<ControlProps> {
  render() {
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <StyledSwitch
          onChange={this.onToggle}
          defaultChecked={this.props.propertyValue}
          large
        />
      </ControlWrapper>
    );
  }

  onToggle = () => {
    this.updateProperty(this.props.propertyName, !this.props.propertyValue);
  };

  getControlType(): ControlType {
    return "SWITCH";
  }
}

export type SwitchControlProps = ControlProps;

export default SwitchControl;
