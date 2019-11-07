import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledSwitch } from "./StyledControls";
import { ControlType } from "../../constants/PropertyControlConstants";

class SwitchControl extends BaseControl<ControlProps> {
  render() {
    return (
      <ControlWrapper orientation={"HORIZONTAL"}>
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
