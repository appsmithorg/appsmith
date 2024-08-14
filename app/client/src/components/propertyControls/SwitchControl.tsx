import React from "react";
import styled from "styled-components";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Switch } from "@appsmith/ads";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

const SwitchContainer = styled.div`
  .ads-v2-switch__label {
    justify-content: flex-end;
    min-width: 0px;
  }
`;

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
      <SwitchContainer ref={this.containerRef}>
        <Switch
          className={this.props.propertyValue ? "checked" : "unchecked"}
          isSelected={this.props.propertyValue}
          onChange={this.onToggle}
        />
      </SwitchContainer>
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return value === "true" || value === "false";
  }
}

export type SwitchControlProps = ControlProps;

export default SwitchControl;
