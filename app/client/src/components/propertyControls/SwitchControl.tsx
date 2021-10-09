import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import Switch from "components/ads/Switch";

class SwitchControl extends BaseControl<ControlProps> {
  render() {
    const { evaluatedValue, propertyValue } = this.props;
    // Updating propertyValue to defaultValue
    if (propertyValue === undefined) {
      this.updateProperty(this.props.propertyName, evaluatedValue);
    }
    return (
      <Switch
        checked={propertyValue}
        className={propertyValue ? "checked" : "unchecked"}
        defaultChecked={propertyValue}
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
}

export type SwitchControlProps = ControlProps;

export default SwitchControl;
