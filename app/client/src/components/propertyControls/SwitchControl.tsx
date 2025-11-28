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
import DisablePreparedStatementConfirmationModal from "pages/Editor/DisablePreparedStatementConfirmationModal";

const SwitchContainer = styled.div`
  .ads-v2-switch__label {
    justify-content: flex-end;
    min-width: 0px;
  }
`;

interface SwitchControlState {
  showPreparedStatementConfirmation: boolean;
}

class SwitchControl extends BaseControl<ControlProps, SwitchControlState> {
  isUpdatedViaKeyboard = false;
  containerRef = React.createRef<HTMLDivElement>();

  state: SwitchControlState = {
    showPreparedStatementConfirmation: false,
  };

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

  isPreparedStatementSwitch = (): boolean => {
    const configProperty = this.props.propertyName || "";
    return (
      configProperty ===
        "actionConfiguration.pluginSpecifiedTemplates[0].value" ||
      configProperty === "actionConfiguration.formData.preparedStatement.data"
    );
  };

  onToggle = () => {
    const isPreparedStatement = this.isPreparedStatementSwitch();
    const isTurningOff = this.props.propertyValue === true;

    // Show confirmation dialog when disabling prepared statements
    if (isPreparedStatement && isTurningOff) {
      this.setState({ showPreparedStatementConfirmation: true });
      return;
    }

    // Normal toggle behavior for other switches or when turning on
    this.updateProperty(
      this.props.propertyName,
      !this.props.propertyValue,
      this.isUpdatedViaKeyboard,
    );
    this.isUpdatedViaKeyboard = false;
  };

  handleConfirmDisable = () => {
    this.updateProperty(
      this.props.propertyName,
      false,
      this.isUpdatedViaKeyboard,
    );
    this.isUpdatedViaKeyboard = false;
    this.setState({ showPreparedStatementConfirmation: false });
  };

  handleCancelDisable = () => {
    this.setState({ showPreparedStatementConfirmation: false });
  };

  render() {
    return (
      <>
        <SwitchContainer ref={this.containerRef}>
          <Switch
            className={this.props.propertyValue ? "checked" : "unchecked"}
            isSelected={this.props.propertyValue}
            onChange={this.onToggle}
          />
        </SwitchContainer>
        <DisablePreparedStatementConfirmationModal
          isOpen={this.state.showPreparedStatementConfirmation}
          onCancel={this.handleCancelDisable}
          onConfirm={this.handleConfirmDisable}
        />
      </>
    );
  }

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
