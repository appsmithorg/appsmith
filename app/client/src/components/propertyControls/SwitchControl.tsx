import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledSwitch } from "./StyledControls";

class SwitchControl extends BaseControl<ControlProps> {
  render() {
    return (
      <StyledSwitch
        onChange={this.onToggle}
        defaultChecked={this.props.propertyValue}
        large
      />
    );
  }

  onToggle = () => {
    this.updateProperty(this.props.propertyName, !this.props.propertyValue);
  };

  static getControlType() {
    return "SWITCH";
  }
}

export type SwitchControlProps = ControlProps;

export default SwitchControl;
