import React from "react";
import styled from "styled-components";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import { Toggle } from "design-system";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

const StyledToggle = styled(Toggle)`
  &&&& {
    padding: 0;
    margin-bottom: 4px;
  }
`;

class ToggleControl extends BaseControl<ControlProps> {
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
      e.detail.component === "Toggle" &&
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
        <StyledToggle
          className={this.props.propertyValue ? "checked" : "unchecked"}
          onToggle={this.onToggle}
          value={this.props.propertyValue}
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

export type ToggleControlProps = ControlProps;

export default ToggleControl;
