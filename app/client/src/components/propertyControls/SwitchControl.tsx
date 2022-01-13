import React from "react";
import { get } from "lodash";
import BaseControl, { ControlProps } from "./BaseControl";
import Switch from "components/ads/Switch";

class SwitchControl extends BaseControl<ControlProps> {
  getPropertyValue = () => {
    // We are using the evaluated value as the JSONForm widget might
    // pass a binding as propertyValue which might lead to unfamiliar behaviors.
    const evaluatedValue = get(
      this.props.widgetProperties.__evaluation__?.evaluatedValues || {},
      this.props.propertyName,
      "",
    );

    return typeof evaluatedValue === "boolean"
      ? evaluatedValue
      : this.props.propertyValue;
  };
  render() {
    const propertyValue = this.getPropertyValue();

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
    const propertyValue = this.getPropertyValue();

    this.updateProperty(this.props.propertyName, !propertyValue);
  };

  static getControlType() {
    return "SWITCH";
  }
}

export type SwitchControlProps = ControlProps;

export default SwitchControl;
