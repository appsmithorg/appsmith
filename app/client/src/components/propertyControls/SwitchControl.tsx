import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import Switch from "components/ads/Switch";
import { INTERACTION_ANALYTICS_EVENT } from "utils/AppsmithUtils";

class SwitchControl extends BaseControl<ControlProps> {
  isUpdatedViaKeyboard = false;
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.containerRef.current?.addEventListener(
      INTERACTION_ANALYTICS_EVENT,
      this.handleKbdEvent,
    );
  }

  componentWillUnmount() {
    this.containerRef.current?.removeEventListener(
      INTERACTION_ANALYTICS_EVENT,
      this.handleKbdEvent,
    );
  }

  handleKbdEvent = () => {
    this.isUpdatedViaKeyboard = true;
  };

  render() {
    return (
      <div ref={this.containerRef}>
        <Switch
          checked={this.props.propertyValue}
          className={this.props.propertyValue ? "checked" : "unchecked"}
          defaultChecked={this.props.propertyValue}
          large
          onChange={this.onToggle}
        />
      </div>
    );
  }

  onToggle = () => {
    this.updateProperty(
      this.props.propertyName,
      !this.props.propertyValue,
      this.isUpdatedViaKeyboard,
    );
    this.isUpdatedViaKeyboard = false;
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
