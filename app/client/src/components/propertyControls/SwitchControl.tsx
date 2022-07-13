import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import Switch from "components/ads/Switch";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

class SwitchControl extends BaseControl<ControlProps> {
  isUpdatedViaKeyboard = false;
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.containerRef.current?.addEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  componentWillUnmount() {
    this.containerRef.current?.removeEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  handleAdsEvent = (e: CustomEvent<DSEventDetail>) => {
    if (
      e.detail.component === "AdsSwitch" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      this.isUpdatedViaKeyboard = true;
      emitInteractionAnalyticsEvent(this.containerRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
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
