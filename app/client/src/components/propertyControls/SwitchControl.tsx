import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import Switch from "components/ads/Switch";

class SwitchControl extends BaseControl<ControlProps> {
  render() {
    return (
      <Switch
        checked={this.props.propertyValue}
        className={this.props.propertyValue ? "checked" : "unchecked"}
        defaultChecked={this.props.propertyValue}
        large
        onChange={this.onToggle}
      />
    );
  }

  onToggle = () => {
    this.updateProperty(this.props.propertyName, !this.props.propertyValue);
  };

  static getControlType() {
    return "SWITCH";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return value === "true" || value === "false";
  }
}

export type SwitchControlProps = ControlProps;

export default SwitchControl;
